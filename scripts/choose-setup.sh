#!/bin/bash
# OmniMind Setup Chooser
# Helps users choose between Google AI Studio setup and our hybrid setup

set -e

echo "========================================="
echo "      OmniMind Setup Assistant"
echo "========================================="
echo ""
echo "This project combines:"
echo "1. Google AI Studio's beautiful React UI"
echo "2. Our scalable, local-first backend"
echo ""
echo "Choose your setup:"
echo ""

PS3="Please enter your choice (1-4): "
options=("Quick Development (Google's original)" "Hybrid Development (Both systems)" "N150 Production (Full deployment)" "Exit")

select opt in "${options[@]}"
do
    case $opt in
        "Quick Development (Google's original)")
            echo ""
            echo "Setting up Google AI Studio's original OmniMind..."
            echo "This uses Express.js + SQLite + Gemini API"
            echo ""
            
            if [ ! -f "web/.env.local" ]; then
                cp web/.env.example web/.env.local
                echo "Created web/.env.local - please add your GEMINI_API_KEY"
            fi
            
            cd web
            echo "Installing dependencies..."
            npm install
            
            echo ""
            echo "✅ Setup complete!"
            echo "To start: npm run dev"
            echo "Access: http://localhost:3000"
            echo ""
            echo "Note: This uses Google's Gemini API (cloud-based)"
            break
            ;;
            
        "Hybrid Development (Both systems)")
            echo ""
            echo "Setting up Hybrid OmniMind..."
            echo "This runs both Google's UI and our FastAPI backend"
            echo ""
            
            if [ ! -f ".env" ]; then
                cp .env.example .env
                echo "Created .env - please review configuration"
            fi
            
            echo "Starting Docker Compose development environment..."
            docker-compose -f docker-compose.dev.yml up -d
            
            echo ""
            echo "✅ Hybrid setup complete!"
            echo "Access:"
            echo "  - Google's UI: http://localhost:3000"
            echo "  - Our API: http://localhost:8080"
            echo "  - API docs: http://localhost:8080/docs"
            echo ""
            echo "To stop: docker-compose -f docker-compose.dev.yml down"
            break
            ;;
            
        "N150 Production (Full deployment)")
            echo ""
            echo "Setting up Production OmniMind for N150..."
            echo "This uses our scalable, local-first architecture"
            echo ""
            
            if [ ! -f ".env" ]; then
                cp .env.example .env
                echo "Created .env - please review configuration"
            fi
            
            echo "Checking if setup-n150.sh exists..."
            if [ -f "scripts/setup-n150.sh" ]; then
                echo "Running automated N150 setup..."
                chmod +x scripts/setup-n150.sh
                read -p "Run as root? (y/n): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    sudo ./scripts/setup-n150.sh
                else
                    echo "Please run: sudo ./scripts/setup-n150.sh"
                fi
            else
                echo "Starting production Docker Compose..."
                docker-compose up -d
                
                echo ""
                echo "✅ Production setup complete!"
                echo "Access: http://localhost:3000"
                echo ""
                echo "To stop: docker-compose down"
            fi
            break
            ;;
            
        "Exit")
            echo "Exiting setup assistant"
            break
            ;;
            
        *) 
            echo "Invalid option $REPLY"
            ;;
    esac
done

echo ""
echo "========================================="
echo "        Setup Assistant Complete"
echo "========================================="
echo ""
echo "For more information:"
echo "  - README.md: Complete documentation"
echo "  - MERGE_PLAN.md: Architecture details"
echo "  - OMNIMIND_SUMMARY.md: Project overview"
echo ""
echo "Repository: https://github.com/FranklinIV94/omnimind"
echo ""