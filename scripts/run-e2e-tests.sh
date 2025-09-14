#!/bin/bash

# E2E Test Runner Script for Medical Appointment Scheduling
# This script helps run E2E tests in different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print header
print_header() {
    echo
    print_color $BLUE "=================================="
    print_color $BLUE "$1"
    print_color $BLUE "=================================="
    echo
}

# Function to check if API Gateway URL is set
check_api_url() {
    if [ -z "$API_GATEWAY_URL" ]; then
        print_color $YELLOW "⚠️  API_GATEWAY_URL not set"
        print_color $YELLOW "   HTTP tests will be skipped"
        print_color $YELLOW "   To run full E2E tests, set API_GATEWAY_URL:"
        print_color $YELLOW "   export API_GATEWAY_URL=https://your-api-id.execute-api.region.amazonaws.com/stage"
        echo
        return 1
    else
        print_color $GREEN "✅ API_GATEWAY_URL set: $API_GATEWAY_URL"
        return 0
    fi
}

# Function to run local E2E tests (simulated)
run_local_tests() {
    print_header "Running Local E2E Tests (Simulated)"
    print_color $BLUE "🔧 Running tests with mocked responses..."
    
    npm run test:e2e
    
    print_color $GREEN "✅ Local E2E tests completed"
}

# Function to run E2E tests against deployed environment
run_deployed_tests() {
    local stage=$1
    
    print_header "Running E2E Tests Against $stage Environment"
    
    if ! check_api_url; then
        print_color $RED "❌ Cannot run deployed tests without API_GATEWAY_URL"
        exit 1
    fi
    
    print_color $BLUE "🌐 Running real HTTP tests against deployed API..."
    export STAGE=$stage
    
    if [ "$stage" = "prod" ]; then
        # For production, run only smoke tests
        npm run test:smoke:prod
    else
        # For dev/staging, run full HTTP tests
        npm run test:e2e:http:dev
    fi
    
    print_color $GREEN "✅ Deployed environment tests completed"
}

# Function to get API Gateway URL from AWS CLI
get_api_url_from_aws() {
    local stage=$1
    
    print_color $BLUE "🔍 Attempting to get API Gateway URL from AWS..."
    
    # Try to get the API Gateway URL from AWS CLI
    local api_id=$(aws apigateway get-rest-apis --query "items[?name=='medical-appointment-scheduling-$stage'].id" --output text 2>/dev/null || echo "")
    
    if [ -n "$api_id" ] && [ "$api_id" != "None" ]; then
        local region=$(aws configure get region 2>/dev/null || echo "us-east-1")
        export API_GATEWAY_URL="https://${api_id}.execute-api.${region}.amazonaws.com/${stage}"
        print_color $GREEN "✅ Found API Gateway URL: $API_GATEWAY_URL"
        return 0
    else
        print_color $YELLOW "⚠️  Could not automatically detect API Gateway URL"
        return 1
    fi
}

# Function to display usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo
    echo "Options:"
    echo "  local           Run local E2E tests with simulated responses"
    echo "  dev             Run E2E tests against dev environment" 
    echo "  prod            Run smoke tests against production environment"
    echo "  auto-dev        Auto-detect dev API URL and run tests"
    echo "  auto-prod       Auto-detect prod API URL and run smoke tests"
    echo "  help            Show this help message"
    echo
    echo "Environment Variables:"
    echo "  API_GATEWAY_URL Required for deployed environment tests"
    echo "  STAGE           Optional, defaults to 'dev'"
    echo
    echo "Examples:"
    echo "  $0 local"
    echo "  API_GATEWAY_URL=https://abc123.execute-api.us-east-1.amazonaws.com/dev $0 dev"
    echo "  $0 auto-dev"
}

# Function to run pre-test checks
run_pre_checks() {
    print_header "Pre-Test Checks"
    
    # Check if Node.js and npm are available
    if ! command -v node &> /dev/null; then
        print_color $RED "❌ Node.js is required but not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_color $RED "❌ npm is required but not installed"
        exit 1
    fi
    
    print_color $GREEN "✅ Node.js $(node --version) and npm $(npm --version) available"
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_color $YELLOW "⚠️  node_modules not found, running npm install..."
        npm install
    fi
    
    print_color $GREEN "✅ Dependencies are installed"
    
    # Check if build is up to date
    print_color $BLUE "🔧 Building project..."
    npm run build
    
    print_color $GREEN "✅ Project built successfully"
}

# Main script logic
main() {
    local command=${1:-help}
    
    case $command in
        "local")
            run_pre_checks
            run_local_tests
            ;;
        "dev")
            run_pre_checks
            run_deployed_tests "dev"
            ;;
        "prod")
            run_pre_checks
            run_deployed_tests "prod"
            ;;
        "auto-dev")
            run_pre_checks
            if get_api_url_from_aws "dev"; then
                run_deployed_tests "dev"
            else
                print_color $RED "❌ Could not auto-detect dev API URL"
                print_color $YELLOW "💡 Try: API_GATEWAY_URL=https://your-api-id.execute-api.region.amazonaws.com/dev $0 dev"
                exit 1
            fi
            ;;
        "auto-prod")
            run_pre_checks
            if get_api_url_from_aws "prod"; then
                run_deployed_tests "prod"
            else
                print_color $RED "❌ Could not auto-detect prod API URL"
                print_color $YELLOW "💡 Try: API_GATEWAY_URL=https://your-api-id.execute-api.region.amazonaws.com/prod $0 prod"
                exit 1
            fi
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            print_color $RED "❌ Unknown command: $command"
            echo
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
