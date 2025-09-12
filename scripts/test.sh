#!/bin/bash
# scripts/test.sh - Test execution script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TEST_TYPE=${1:-all}

echo -e "${BLUE}🧪 Running tests: $TEST_TYPE${NC}"

case $TEST_TYPE in
    "unit")
        echo -e "${YELLOW}Running unit tests...${NC}"
        pnpm run test:unit
        ;;
    "integration")
        echo -e "${YELLOW}Running integration tests...${NC}"
        pnpm run test:integration
        ;;
    "coverage")
        echo -e "${YELLOW}Running tests with coverage...${NC}"
        pnpm run test:coverage
        ;;
    "all")
        echo -e "${YELLOW}Running all tests...${NC}"
        pnpm run test
        ;;
    *)
        echo -e "${RED}❌ Invalid test type: $TEST_TYPE${NC}"
        echo -e "Available options: unit, integration, coverage, all"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Tests completed successfully!${NC}"
