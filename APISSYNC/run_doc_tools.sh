#!/bin/bash
# API Documentation Tools Runner
# This script simplifies running the API documentation tools

# Set working directory to the project root
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

# Define colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}ECAR API Documentation Tools${NC}"
echo -e "${BLUE}=======================================${NC}"
echo

# Function to run the analyzer
run_analyzer() {
    echo -e "${GREEN}Running API Documentation Analyzer...${NC}"
    python3 APISSYNC/api_doc_analyzer.py
    echo
}

# Function to run the improver
run_improver() {
    if [ $# -eq 0 ]; then
        echo -e "${GREEN}Running API Documentation Improver for all endpoints...${NC}"
        python3 APISSYNC/api_doc_improver.py
    elif [ $# -eq 1 ]; then
        echo -e "${GREEN}Running API Documentation Improver for ${YELLOW}$1${GREEN}...${NC}"
        python3 APISSYNC/api_doc_improver.py "$1"
    else
        echo -e "${GREEN}Running API Documentation Improver for ${YELLOW}$1.$2${GREEN}...${NC}"
        python3 APISSYNC/api_doc_improver.py "$1" "$2"
    fi
    echo
}

# Function to run the schema fixer
run_schema_fixer() {
    echo -e "${GREEN}Running Schema Serializer Fixer...${NC}"
    python3 APISSYNC/fix_schema_serializers.py
    echo
}

# Show menu and process input
show_menu() {
    echo "Choose an option:"
    echo "1. Run API Documentation Analyzer"
    echo "2. Run API Documentation Improver for all endpoints"
    echo "3. Run API Documentation Improver for a specific ViewSet"
    echo "4. Run API Documentation Improver for a specific action"
    echo "5. Run Schema Serializer Fixer"
    echo "6. Run all tools"
    echo "0. Exit"
    echo
    read -p "Enter your choice (0-6): " choice
    
    case $choice in
        1) run_analyzer ;;
        2) run_improver ;;
        3) 
            read -p "Enter ViewSet name: " viewset
            run_improver "$viewset"
            ;;
        4)
            read -p "Enter ViewSet name: " viewset
            read -p "Enter action name: " action
            run_improver "$viewset" "$action"
            ;;
        5) run_schema_fixer ;;
        6)
            run_analyzer
            run_improver
            run_schema_fixer
            ;;
        0) exit 0 ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
    
    echo
    read -p "Press Enter to continue..."
    clear
    show_menu
}

# Check if arguments were provided
if [ $# -eq 0 ]; then
    # No arguments, show menu
    clear
    show_menu
else
    # Arguments provided, run specific tool
    case $1 in
        "analyze") run_analyzer ;;
        "improve")
            if [ $# -eq 1 ]; then
                run_improver
            elif [ $# -eq 2 ]; then
                run_improver "$2"
            else
                run_improver "$2" "$3"
            fi
            ;;
        "fix-schema") run_schema_fixer ;;
        "all")
            run_analyzer
            run_improver
            run_schema_fixer
            ;;
        *)
            echo -e "${RED}Invalid argument: $1${NC}"
            echo "Usage: $0 [analyze|improve|fix-schema|all]"
            exit 1
            ;;
    esac
fi 