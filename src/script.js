const script = `#!/bin/bash
set -euo pipefail
shopt -s nullglob

echo "Running unit tests for $UNIT_TEST_PROJECT"
echo "Dotnet version used: "
dotnet --version

# Show parameters
echo "UNIT_TEST_PROJECT: $UNIT_TEST_PROJECT"
echo "UNIT_TEST_COVERAGE_THRESHOLD: $UNIT_TEST_COVERAGE_THRESHOLD"
echo "UNIT_TEST_USE_MTP_DOTNET_TEST: $UNIT_TEST_USE_MTP_DOTNET_TEST"

UNIT_TEST_PROJECT_DIR="$UNIT_TEST_PROJECT"
if [ -f "$UNIT_TEST_PROJECT" ]; then
    UNIT_TEST_PROJECT_DIR="$(dirname "$UNIT_TEST_PROJECT")"
fi

UNIT_TEST_REPORT_DIR="$UNIT_TEST_PROJECT_DIR/report"

# Export .NET tools
export PATH="$PATH:/root/.dotnet/tools"

# Install report generator tool
dotnet tool install -g dotnet-reportgenerator-globaltool

# Install required packages
if [ "$UNIT_TEST_USE_MTP_DOTNET_TEST" = "true" ]; then
    dotnet add "$UNIT_TEST_PROJECT" package Microsoft.Testing.Platform
    dotnet add "$UNIT_TEST_PROJECT" package Microsoft.Testing.Platform.MSBuild
    dotnet add "$UNIT_TEST_PROJECT" package Microsoft.Testing.Extensions.Telemetry
    dotnet add "$UNIT_TEST_PROJECT" package Microsoft.Testing.Extensions.TrxReport.Abstractions
    dotnet add "$UNIT_TEST_PROJECT" package coverlet.MTP
else
    dotnet add "$UNIT_TEST_PROJECT" package coverlet.msbuild
fi

# Restore unit test project
dotnet restore -s "https://api.nuget.org/v3/index.json" "$UNIT_TEST_PROJECT"

# Sanitise Exclude Modules
if [ -z "$UNIT_TEST_EXCLUDE_MODULES" ]; then
    UNIT_TEST_EXCLUDE_MODULES="[xunit.*]*"
else
    UNIT_TEST_EXCLUDE_MODULES="[xunit.*]*,$UNIT_TEST_EXCLUDE_MODULES"
fi

# Run unit tests and collect code coverage
dotnet build "$UNIT_TEST_PROJECT"
export IS_CI="true"

if [ "$UNIT_TEST_USE_MTP_DOTNET_TEST" = "true" ]; then
    if [ "$UNIT_TEST_COVERAGE_THRESHOLD" != "0" ]; then
        echo "::warning::Coverage threshold enforcement is not supported by coverlet.MTP yet; skipping threshold check."
    fi

    COVERLET_ARGS=(
      --project "$UNIT_TEST_PROJECT"
      --results-directory "$UNIT_TEST_PROJECT_DIR"
      --coverlet
      --coverlet-output-format cobertura
    )

    IFS=',' read -ra EXCLUDE_MODULES <<< "$UNIT_TEST_EXCLUDE_MODULES"
    for EXCLUDE_MODULE in "$\{EXCLUDE_MODULES[@]\}"; do
        if [ -n "$EXCLUDE_MODULE" ]; then
            COVERLET_ARGS+=(--coverlet-exclude "$EXCLUDE_MODULE")
        fi
    done

    IFS=',' read -ra EXCLUDE_FILES <<< "$UNIT_TEST_EXCLUDE_FILES"
    for EXCLUDE_FILE in "$\{EXCLUDE_FILES[@]\}"; do
        if [ -n "$EXCLUDE_FILE" ]; then
            COVERLET_ARGS+=(--coverlet-exclude-by-file "$EXCLUDE_FILE")
        fi
    done

    dotnet test "$\{COVERLET_ARGS[@]\}"
else
    dotnet test "$UNIT_TEST_PROJECT" \
      /p:CollectCoverage=true \
      /p:CoverletOutputFormat=cobertura \
      /p:CoverletOutput=lcov \
      /p:Threshold=$UNIT_TEST_COVERAGE_THRESHOLD \
      /p:ThresholdType=line \
      /p:ThresholdStat=total \
      /p:Exclude=\"$UNIT_TEST_EXCLUDE_MODULES\" \
      /p:ExcludeByFile=\"$UNIT_TEST_EXCLUDE_FILES\"
fi

coverage_files=("$UNIT_TEST_PROJECT_DIR"/*.cobertura*.xml)
if [ $\{#coverage_files[@]\} -eq 0 ]; then
    echo "No Cobertura coverage report was generated in $UNIT_TEST_PROJECT_DIR" >&2
    exit 1
fi

# Generate code coverage report
reportgenerator "-reports:$\{UNIT_TEST_PROJECT_DIR\}/*.cobertura*.xml" "-targetdir:$\{UNIT_TEST_REPORT_DIR\}" "-reporttypes:Html"

# Copy the cobertura xml file for inline coverage analysis
cp "$\{coverage_files[@]\}" "$UNIT_TEST_REPORT_DIR"
`;

module.exports = script;
