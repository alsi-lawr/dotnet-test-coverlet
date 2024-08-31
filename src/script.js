const script = `#!/bin/bash

echo "Running unit tests for $UNIT_TEST_PROJECT"
echo "Dotnet version used: "
dotnet --version

# Show parameters
echo "UNIT_TEST_PROJECT: $UNIT_TEST_PROJECT"
echo "UNIT_TEST_COVERAGE_THRESHOLD: $UNIT_TEST_COVERAGE_THRESHOLD"

# Export .NET tools
export PATH="$PATH:/root/.dotnet/tools"

# Install report generator tool
dotnet tool install -g dotnet-reportgenerator-globaltool

# Install required packages
dotnet add $UNIT_TEST_PROJECT package coverlet.msbuild
dotnet add $UNIT_TEST_PROJECT package coverlet.collector

# Restore unit test project
dotnet restore -s "https://api.nuget.org/v3/index.json" $UNIT_TEST_PROJECT

# Sanitise Exclude Modules
if [ -z "$UNIT_TEST_EXCLUDE_MODULES" ]; then
    UNIT_TEST_EXCLUDE_MODULES="[xunit.*]*"
else
    UNIT_TEST_EXCLUDE_MODULES="[xunit.*]*,$UNIT_TEST_EXCLUDE_MODULES"
fi

# Run unit tests and collect code coverage
dotnet build $UNIT_TEST_PROJECT
export IS_CI="true"
dotnet test $UNIT_TEST_PROJECT \
  /p:CollectCoverage=true \
  /p:CoverletOutputFormat=cobertura \
  /p:CoverletOutput=lcov \
  /p:Threshold=$UNIT_TEST_COVERAGE_THRESHOLD \
  /p:ThresholdType=line \
  /p:ThresholdStat=total \
  /p:Exclude=\"$UNIT_TEST_EXCLUDE_MODULES\" \
  /p:ExcludeByFile=\"$UNIT_TEST_EXCLUDE_FILES\"

# Generate code coverage report
reportgenerator "-reports:${UNIT_TEST_PROJECT}/lcov*.cobertura.xml" "-targetdir:${UNIT_TEST_PROJECT}/report" "-reporttypes:Html"

# Copy the cobertura xml file for inline coverage analysis
cp ${UNIT_TEST_PROJECT}/*.cobertura.xml ${UNIT_TEST_PROJECT}/report
`;

module.exports = script;
