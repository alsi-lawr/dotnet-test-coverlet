# Run Unit Tests and Generate Code Coverage

This reusable action runs unit tests on a .NET project and generates a code coverage report. It supports configuration for custom test project paths, exclusion of files and modules from coverage, and setting a coverage threshold.

![Test Workflow](https://github.com/alsi-lawr/dotnet-test-coverlet/actions/workflows/test-action.yml/badge.svg)
![GitHub release)](https://img.shields.io/github/v/release/alsi-lawr/dotnet-test-coverlet)
![Licence](https://img.shields.io/github/license/alsi-lawr/dotnet-test-coverlet)
![GitHub :star:](https://img.shields.io/github/stars/alsi-lawr/dotnet-test-coverlet?style=social)

## Usage

Use this action in your workflow by specifying the test project file path, any exclusions for coverage, and the .NET SDK version.

### Inputs

- `project`: **Required**. The path to the `.csproj` file of the .NET unit test project. The path should be relative to the repository root.
- `exclude-files`: **Optional**. Files to exclude from code coverage analysis. Supports glob patterns. Defaults to an empty string.
- `exclude-modules`: **Optional**. Modules to exclude from code coverage analysis. Defaults to an empty string.
- `threshold`: **Optional**. Code coverage threshold percentage. Defaults to `0`.
- `dotnet-version`: **Optional**. The .NET SDK version to use. Defaults to `6.0`.

### Outputs

- `coverage-report-path`: The path to the generated code coverage report directory. This output can be used to chain into other steps, such as uploading the report as an artifact.

### Example

```yaml
name: Run Unit Tests and Generate Coverage

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
      
      - name: Run Unit Tests and Generate Coverage
        id: run-tests
        uses: alsi-lawr/dotnet-test-coverlet@v1
        with:
          project: 'src/MyProject.Tests/MyProject.Tests.csproj'  # Specify the correct path to your test project file
          exclude-files: '**/Migrations/*.cs'  # Example: Exclude migrations files
          threshold: 80  # Example: Set coverage threshold to 80%
          dotnet-version: '8.0'

      - name: Upload Coverage Report
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: ${{ steps.run-tests.outputs.coverage-report-path }}  # Use the output from the previous step to upload the report
```

### Security

- **Sensitive Data**: Ensure that no sensitive data (like API keys or personal information) is included in the test project or output logs, especially when uploading artifacts.

### Chaining with Artifact Upload

This action can be seamlessly chained with an artifact upload step to store the generated coverage report. After running the tests and generating the coverage report, the output `coverage-report-path` can be used in a subsequent step to upload the report as an artifact, making it easily accessible for download and review.

### Additional Notes

- **Dockerized Execution**: This action runs inside a Docker container with the specified .NET SDK version, ensuring a consistent environment for running tests and generating coverage reports.
- **Customization**: You can customize the exclusions and thresholds to suit your project's needs, ensuring that only relevant parts of your codebase are included in the coverage analysis.

## Contributing

Contributions are welcome! Please refer to the [contributing guidelines](./docs/CONTRIBUTING.md) for more information.
