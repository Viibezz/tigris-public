"""
Static site generator for a web project.

This script processes Handlebars templates (`.hbs` files) from a source directory (`src`),
compiles them with context data (including environment variables and page-specific info),
and generates static HTML files in a target directory (`docs`). It also handles
the copying of static assets (like CSS, JS, images) and specific root files
(e.g., `robots.txt`, `manifest.json`) to the target directory.

The main functions are:
- `preprocess()`: Cleans the target directory before a new build.
- `static_content_builder()`: Orchestrates the template compilation and HTML generation.
- `copy_assets()`: Copies static assets and predefined root files.

The script uses `pybars` for Handlebars template compilation and `python-dotenv`
for managing environment variables.
"""
from pybars import Compiler
from dotenv import dotenv_values
from rich.console import Console
import os
import shutil
import datetime
import rcssmin
import rjsmin
import subprocess
import json

# Initialize console for rich text output
console = Console()

# Define global source and target directories
current_script_dir = os.path.dirname(os.path.abspath(__file__))

# Output directory for the generated static site
target_dir = os.path.join(current_script_dir, os.pardir, "docs")
target_dir = os.path.abspath(target_dir)

# Source directory containing templates and assets
source_dir = os.path.join(current_script_dir, os.pardir, "src")
source_dir = os.path.abspath(source_dir)

# Path to the environment variables file
env_file_path = os.path.join(current_script_dir, ".env")
env_file_path = os.path.abspath(env_file_path)

# Base path for source assets
source_assets_base = os.path.join(source_dir, "assets")

# Define paths for menu and catering JSON data within the same 'menu-data' folder
menu_data_folder_path = os.path.join(source_assets_base, "menu-data")
menu_data_file_path = os.path.join(menu_data_folder_path, "menuData.json")
catering_data_file_path = os.path.join(menu_data_folder_path, "cateringData.json")


def get_partials(compiler: Compiler) -> dict:
    """
    Loads and compiles Handlebars partial templates from the 'partials' directory.

    Args:
        compiler (Compiler): The Pybars compiler instance.

    Returns:
        dict: A dictionary where keys are partial names and values are compiled partials.
    """
    partials_path = os.path.join(source_dir, "partials")
    if not os.path.isdir(partials_path):
        console.log(f"[yellow]Warning: Partials directory not found at {os.path.relpath(partials_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}[/yellow]")
        return {}
        
    partial_files = [f for f in os.listdir(partials_path) if f.endswith(".hbs")]
    partials = {}
    for partial_file in partial_files:
        partial_name = partial_file.replace(".hbs", "")
        try:
            with open(os.path.join(partials_path, partial_file), "r", encoding="utf-8") as file:
                partials[partial_name] = compiler.compile(file.read())
        except Exception as e:
            console.log(f"[bold red]Error compiling partial {partial_file}: {e}[/bold red]")
    return partials


def compile_template(compiler: Compiler, source_file_path: str, context: dict, partials: dict, helpers: dict) -> str | None:
    """
    Compiles and renders a single Handlebars template file into HTML.

    Args:
        compiler (Compiler): The Pybars compiler instance.
        source_file_path (str): The full path to the Handlebars template file.
        context (dict): The data context to pass to the template.
        partials (dict): A dictionary of compiled partial templates.
        helpers (dict): A dictionary of custom Handlebars helper functions.

    Returns:
        str | None: The rendered HTML string if successful, otherwise None.
    """
    try:
        with open(source_file_path, "r", encoding="utf-8") as source:
            template_string = source.read()
        template = compiler.compile(template_string)
        return template(context, partials=partials, helpers=helpers)
    except FileNotFoundError:
        console.log(f"[bold red]Error: Template file not found at {os.path.relpath(source_file_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}[/bold red]")
        return None
    except Exception as e:
        console.log(f"[bold red]Error compiling template {os.path.relpath(source_file_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}: {e}[/bold red]")
        return None


def determine_output_path(source_file: str, target_dir_base: str) -> str:
    """
    Determines the output HTML file path for a given source template.

    For 'index.hbs', it generates 'index.html' in the root target directory.
    For other templates (e.g., 'about.hbs'), it creates a subfolder (e.g., 'about')
    and places 'index.html' inside (e.g., 'docs/about/index.html').

    Args:
        source_file (str): The name of the source Handlebars template file (e.g., "index.hbs").
        target_dir_base (str): The base path of the target (output) directory.

    Returns:
        str: The full path where the rendered HTML file should be saved.
    """
    folder_name = source_file.replace(".hbs", "")
    if source_file == "index.hbs":
        return os.path.join(target_dir_base, "index.html")
    else:
        return os.path.join(target_dir_base, folder_name, "index.html")


def static_content_builder() -> None:
    """
    Orchestrates the generation of static HTML pages from Handlebars templates.

    It loads environment variables, current year, and dynamically loads
    menu and catering data from JSON files. For each template, it prepares
    the rendering context (including page-specific data like gallery items or
    full menu/catering data) and compiles the template into an HTML file.
    """
    console.log(f"Starting static content build in '{os.path.relpath(source_dir, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}' -> '{os.path.relpath(target_dir, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}'")
    compiler = Compiler()
    partials = get_partials(compiler)
    templates_path = os.path.join(source_dir, "templates")

    # Define Handlebars helper functions
    def eq(this, arg1, arg2, **kwargs) -> bool: return arg1 == arg2
    def nq(this, arg1, arg2, **kwargs) -> bool: return arg1 != arg2
    def and_(this, arg1, arg2, **kwargs) -> bool: return arg1 and arg2
    helpers = {"eq": eq, "nq": nq, "and_": and_}

    template_files = [f for f in os.listdir(templates_path) if f.endswith(".hbs") and os.path.isfile(os.path.join(templates_path, f))]

    # Load menu data from JSON
    loaded_menu_data = {}
    console.log(f"Loading menu data from {os.path.relpath(menu_data_file_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}")
    if os.path.exists(menu_data_file_path):
        try:
            with open(menu_data_file_path, 'r', encoding='utf-8') as f: loaded_menu_data = json.load(f)
            console.log("Successfully loaded menu data.")
        except Exception as e: console.log(f"[bold red]Error loading menu data: {e}[/bold red]")
    else: console.log(f"[yellow]Warning: Menu data file not found at {os.path.relpath(menu_data_file_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}[/yellow]")

    # Load catering data from JSON
    loaded_catering_data = {}
    console.log(f"Loading catering data from {os.path.relpath(catering_data_file_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}")
    if os.path.exists(catering_data_file_path):
        try:
            with open(catering_data_file_path, 'r', encoding='utf-8') as f: loaded_catering_data = json.load(f)
            console.log("Successfully loaded catering data.")
        except Exception as e: console.log(f"[bold red]Error loading catering data: {e}[/bold red]")
    else: console.log(f"[yellow]Warning: Catering data file not found at {os.path.relpath(catering_data_file_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}[/yellow]")


    for file_name in template_files:
        console.log(f"Processing template: {file_name}")
        
        source_file_full_path = os.path.join(templates_path, file_name)
        
        # Initialize context for the current page
        context = dotenv_values(env_file_path) if os.path.exists(env_file_path) else {}
        context["page"] = file_name.replace(".hbs", "")
        context["year"] = datetime.datetime.now().year

        # Prepare context data based on the current page
        if context["page"] == "gallery" and loaded_menu_data:
            gallery_items_list = []
            for section_key, section_data in loaded_menu_data.items():
                if "items" in section_data and isinstance(section_data["items"], list):
                    for item in section_data["items"]:
                        if "image" in item and "thumb" in item:
                            gallery_items_list.append({
                                "category": item.get("category"),
                                "name": item.get("name", "Untitled Item"),
                                "alt_text": item.get("name", "Gallery Image"),
                                "thumb400": item["thumb1200"],
                                "thumb800": item["thumb1200"],
                                "thumb1200": item["thumb1200"],
                                "caption": item.get("description", item.get("name", "No caption provided."))
                            })
            context["gallery_items"] = gallery_items_list
            console.log(f"Prepared {len(gallery_items_list)} gallery items from menu data for gallery page.")
            # Inline gallery items as JSON string for client-side JavaScript
            context["inlined_gallery_items_json"] = json.dumps(gallery_items_list)
        
        elif context["page"] == "menu" and loaded_menu_data:
            # Inline full menu data as JSON string for dynamic JS rendering
            context["inlined_full_menu_data_json"] = json.dumps(loaded_menu_data)
            console.log("Prepared full menu data for menu page.")
            
        elif context["page"] == "catering" and loaded_catering_data:
            # Inline full catering data as JSON string for dynamic JS rendering
            context["inlined_catering_data_json"] = json.dumps(loaded_catering_data)
            console.log("Prepared full catering data for catering page.")

        rendered_html = compile_template(compiler, source_file_full_path, context, partials, helpers)

        if rendered_html is None:
            console.log(f"[yellow]Skipping {file_name} due to compilation error.[/yellow]")
            continue

        target_html_destination = determine_output_path(file_name, target_dir)

        # Create output directory if it doesn't exist
        output_directory = os.path.dirname(target_html_destination)
        if not os.path.exists(output_directory): os.makedirs(output_directory, exist_ok=True)

        try:
            with open(target_html_destination, "w", encoding="utf-8") as html_file:
                html_file.write(rendered_html)
            console.log(f"Successfully generated: {os.path.relpath(target_html_destination, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}")
        except IOError as e:
            console.log(f"[bold red]Error writing HTML file {target_html_destination}: {e}[/bold red]")


def preprocess() -> None:
    """
    Prepares the target directory by cleaning its contents before a new build.

    This ensures a fresh build and removes any stale files from previous runs.
    """
    def delete_all_in_directory(directory_path: str) -> None:
        if not os.path.isdir(directory_path):
            raise NotADirectoryError(f"{directory_path} is not a valid directory.")
        console.log(f"Cleaning directory: {os.path.relpath(directory_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}")
        for item_name in os.listdir(directory_path):
            item_path = os.path.join(directory_path, item_name)
            try:
                if os.path.isfile(item_path) or os.path.islink(item_path): os.remove(item_path)
                elif os.path.isdir(item_path): shutil.rmtree(item_path)
                console.log(f"Deleted: {os.path.relpath(item_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}")
            except Exception as e: console.log(f"[bold red]Error deleting {item_path}: {e}[/bold red]")

    console.log(f"Starting preprocess: Cleaning up target directory '{os.path.relpath(target_dir, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}'")
    if os.path.exists(target_dir): delete_all_in_directory(target_dir)
    else: console.log(f"Target directory '{os.path.relpath(target_dir, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}' does not exist. Creating it."); os.makedirs(target_dir, exist_ok=True)


def copy_assets() -> None:
    """
    Copies static assets (CSS, JS, images, JSON data) and root files to the target directory.

    It also minifies JavaScript files and performs final CSS minification.
    """
    console.log("Starting asset copying and minification process.")
    os.makedirs(target_dir, exist_ok=True)

    def ensure_target_dir_exists(filepath: str):
        directory = os.path.dirname(filepath)
        if not os.path.exists(directory): os.makedirs(directory, exist_ok=True)

    target_assets_base = os.path.join(target_dir, "assets")

    # Copy and process Bootstrap CSS
    source_bootstrap_path = os.path.join(source_assets_base, "dist", "css", "bootstrap.min.css")
    target_bootstrap_path = os.path.join(target_assets_base, "css", "bootstrap.min.css")
    if os.path.isfile(source_bootstrap_path):
        ensure_target_dir_exists(target_bootstrap_path)
        shutil.copy2(source_bootstrap_path, target_bootstrap_path)
        console.log(f"Copied '{os.path.basename(source_bootstrap_path)}' to '{os.path.relpath(target_bootstrap_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}'.")
    else: console.log(f"[yellow]Warning: Bootstrap CSS not found at '{os.path.relpath(source_bootstrap_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}'[/yellow]")

    # Copy and process custom CSS
    source_custom_css_folder = os.path.join(source_assets_base, "css")
    target_custom_css_folder = os.path.join(target_assets_base, "css")
    if os.path.isdir(source_custom_css_folder):
        if not os.path.exists(target_custom_css_folder): os.makedirs(target_custom_css_folder, exist_ok=True)
        for root, _, files in os.walk(source_custom_css_folder):
            for filename in files:
                if filename.endswith(".css"):
                    source_file_path = os.path.join(root, filename)
                    relative_path = os.path.relpath(source_file_path, source_custom_css_folder)
                    target_file_path = os.path.join(target_custom_css_folder, relative_path)
                    ensure_target_dir_exists(target_file_path)
                    shutil.copy2(source_file_path, target_file_path)
                    console.log(f"Copied '{os.path.basename(source_file_path)}' to '{os.path.relpath(target_file_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}'.")
    else: console.log(f"[yellow]Warning: Custom CSS folder not found at '{os.path.relpath(source_custom_css_folder, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}'[/yellow]")

    # Copy asset folders like 'images' and 'menu-data'
    folder_names_to_copy_from_assets = ["images", "menu-data"] 
    for folder_name in folder_names_to_copy_from_assets:
        source_folder_path = os.path.join(source_assets_base, folder_name)
        target_folder_path = os.path.join(target_assets_base, folder_name)
        if os.path.isdir(source_folder_path):
            if os.path.exists(target_folder_path): shutil.rmtree(target_folder_path)
            shutil.copytree(source_folder_path, target_folder_path)
            console.log(f"Copied '{os.path.relpath(source_folder_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}' to '{os.path.relpath(target_folder_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}' as is.")
        else: console.log(f"[yellow]Warning: Source directory '{os.path.relpath(source_folder_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}' not found.[/yellow]")

    # --- Root icon copies to silence 404s ---
    def safe_copy(src, dst):
        if os.path.isfile(src):
            shutil.copy2(src, dst)
            console.log(f"Placed root asset: {dst}")
        else:
            console.log(f"[yellow]Missing source for {dst}: {src}[/yellow]")
            pass
    favicon_dir = os.path.join(target_assets_base, "images", "favicon")
    safe_copy(os.path.join(favicon_dir, "favicon.ico"), os.path.join(target_dir, "favicon.ico"))
    apple_src = os.path.join(favicon_dir, "180.png")
    safe_copy(apple_src, os.path.join(target_dir, "apple-touch-icon.png"))
    safe_copy(apple_src, os.path.join(target_dir, "apple-touch-icon-precomposed.png"))

    # PurgeCSS is currently commented out. Uncomment and ensure Node.js setup if needed.
    # if css_files_to_process_in_docs:
    #     console.log(f"[cyan]Running PurgeCSS on {len(css_files_to_process_in_docs)} CSS file(s)...[/cyan]")
    #     purge_script_path = os.path.join(current_script_dir, 'nodejs', 'purge_css.js')
    #     nodejs_dir = os.path.join(current_script_dir, 'nodejs')
    #     node_exe_path = "node" 
    #     command = [node_exe_path, purge_script_path] + css_files_to_process_in_docs
    #     try:
    #         subprocess.run(command, check=True, cwd=nodejs_dir, capture_output=True, text=True)
    #         console.log(f"[green]PurgeCSS completed successfully for all specified CSS files.[/green]")
    #     except Exception as e:
    #         console.log(f"[bold red]Error running PurgeCSS: {e}. Ensure Node.js and 'npm install' were run in 'build_utils/nodejs'.[/bold red]")
    # else: console.log("[yellow]No CSS files found for PurgeCSS to process.[/yellow]")
    
    # Copy and minify JavaScript files
    source_js_folder = os.path.join(source_assets_base, "js")
    target_js_folder = os.path.join(target_assets_base, "js")
    if os.path.isdir(source_js_folder):
        if not os.path.exists(target_js_folder): os.makedirs(target_js_folder, exist_ok=True)
        for root, _, files in os.walk(source_js_folder):
            for filename in files:
                source_file_path = os.path.join(root, filename)
                relative_path = os.path.relpath(source_file_path, source_js_folder)
                target_file_path = os.path.join(target_js_folder, relative_path)
                ensure_target_dir_exists(target_file_path)
                try:
                    if filename.endswith(".js") and not filename.endswith(".min.js"):
                        with open(source_file_path, 'r', encoding='utf-8') as f_in: content = f_in.read()
                        minified_content = rjsmin.jsmin(content)
                        with open(target_file_path, 'w', encoding='utf-8') as f_out: f_out.write(minified_content)
                        console.log(f"Minified JS: {os.path.relpath(target_file_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}")
                    else: shutil.copy2(source_file_path, target_file_path); console.log(f"Copied JS/other directly: {os.path.relpath(target_file_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}")
                except Exception as e: console.log(f"[bold red]Error processing JS {filename}: {e}. Copied original.[/bold red]"); shutil.copy2(source_file_path, target_file_path)
    else: console.log(f"[yellow]Warning: Source JS folder not found at '{os.path.relpath(source_js_folder, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}'[/yellow]")

    # Final CSS minification
    console.log("Starting final CSS minification...")
    if os.path.isdir(target_custom_css_folder): 
        for root, _, files in os.walk(target_custom_css_folder):
            for filename in files:
                if filename.endswith(".css"):
                    target_file_path = os.path.join(root, filename)
                    try:
                        with open(target_file_path, 'r', encoding='utf-8') as f_in: content = f_in.read()
                        minified_content = rcssmin.cssmin(content)
                        with open(target_file_path, 'w', encoding='utf-8') as f_out: f_out.write(minified_content)
                        console.log(f"Minified final CSS: {os.path.relpath(target_file_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}")
                    except Exception as e: console.log(f"[bold red]Error minifying CSS {filename}: {e}. Skipping.[/bold red]")
    else: console.log("[yellow]No target CSS folder found for final minification.[/yellow]")

    console.log("Asset copying and processing complete.")

    # Copy root files (e.g., manifest, robots.txt)
    root_files_source_dir = source_dir
    files_to_copy_from_root = ["humans.txt", "manifest.json", "robots.txt", "sitemap.xml", "sw.js"]
    console.log(f"Copying specific root files.")
    for file_name in files_to_copy_from_root:
        source_file_full_path = os.path.join(root_files_source_dir, file_name)
        target_file_full_path = os.path.join(target_dir, file_name)
        if os.path.isfile(source_file_full_path):
            try: shutil.copy2(source_file_full_path, target_file_full_path)
            except IOError as e: console.log(f"[bold red]Error copying root file {file_name}: {e}[/bold red]")
        else: console.log(f"[yellow]Warning: Root file '{os.path.relpath(source_file_full_path, os.path.abspath(os.path.join(current_script_dir, os.pardir)))}' not found.[/yellow]")
    
    console.log("Asset copying and full asset processing complete.")


if __name__ == "__main__":
    console.rule("[bold green]Starting Static Site Generation[/bold green]")
    preprocess()
    static_content_builder()
    copy_assets()
    console.rule("[bold green]Static Site Generation Complete[/bold green]")