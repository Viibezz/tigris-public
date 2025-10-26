#! /bin/bash

# Environment variables for different build targets
dev() {
    export URL="http://192.168.1.81:8000/"
    # export URL="https://viibezz.github.io/tigris-public/"
}

# Set environment based on argument
if [ "$1" == "dev" ]; then
    dev
fi

# This script builds the project using python
python index.py
