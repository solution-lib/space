<!-- ╔══════════════════════════════ BEG ══════════════════════════════╗ -->

<br>
<div align="center">
    <p>
        <img src="./assets/img/logo.png" alt="logo" style="" height="80" />
    </p>
</div>

<div align="center">
    <img src="https://img.shields.io/badge/v-0.0.9-black"/>
    <a href="https://github.com/maysara-elshewehy">
    </a>
    <a href="https://github.com/solution-lib"> <img src="https://img.shields.io/badge/@-solution--lib-black"/> </a>
</div>
<br>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ DOC ══════════════════════════════╗ -->

- ## Quick Start 🔥

    ```bash
    # install via bun or npm
    bun install @solution-lib/space -g

    # Now use 'space' anywhere
    space --help
    ```

    ```bash
    # Create a new space (interactive)
    space init

    # Or with options
    space init my-lib -t lib

    # Navigate and setup
    cd my-lib
    space install
    space build
    ```

    <br>

- ## Commands

    - ### Space Management

        ```bash
        # Create new space (interactive mode)
        space init [name]

        # Create with options
        space init my-lib -t lib                    # Specify type (lib, cli, server, web)
        space init my-lib -t lib --desc "My lib"    # With description

        # Show current space information
        space info
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Package Manager (Bun wrapper)

        ```bash
        # Install dependencies
        space install                   # Install all from package.json
        space i                         # Alias for install
        space install lodash axios      # Install specific packages
        space install lodash --dev      # Install as dev dependency
        space install lodash --global   # Install globally

        # Remove packages
        space remove <packages...>      # Remove with confirmation
        space r <packages...>           # Alias for remove
        space remove lodash axios       # Remove multiple packages
        space remove lodash --global    # Remove global package

        # Update packages
        space update                    # Update all (interactive)
        space up                        # Alias for update
        space update lodash             # Update specific packages

        # Link packages
        space link                      # Link current package globally
        space link <package>            # Link global package to project
        space unlink                    # Unlink current package globally
        space unlink <package>          # Unlink global package from project

        # List packages
        space list                      # List local packages
        space ls                        # Alias for list
        space list --global             # List global packages

        # Run scripts
        space run <script>              # Run any script from package.json
        space run dev                   # Example: run dev script
        space run build -- --watch      # Pass additional args to script
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Build & Development

        ```bash
        # Lint the project
        space lint

        # Build the project
        space build

        # Start the project (builds first, then runs)
        space start                     # Run the built main file
        space start --help              # Pass args to your app
        space start arg1 arg2 --flag    # All args passed through

        # Run tests
        space test                              # Run all tests
        space test path/to/test.ts              # Run specific test file
        space test --coverage                   # Generate coverage report
        space test --coverage --coverage-reporter=lcov  # Specify reporter format
        space test --watch                      # Run in watch mode
        space test --bail                       # Exit on first failure
        space test --timeout 5000               # Set timeout (ms)
        space test --rerun-each 3               # Re-run each test N times
        space test --concurrent                 # Run tests concurrently
        space test -t "math"                    # Filter by test name pattern
        space test --coverage --watch           # Combine multiple options

        # Clean build artifacts
        space clean
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Publishing

        ```bash
        # Publish to npm (interactive)
        space publish

        # Publish with options
        space publish --tag beta                # Publish with tag
        space publish --access public           # Set access level (public/restricted)
        space publish --tag next --access public
        ```

    <br>

- ## Space Types and Examples

    - ### Available Types

        - **`lib`** - TypeScript library for npm

            > Zero dependencies template
            >
            > Perfect for publishing reusable packages
            >
            > Example: [solution-dist/lib](https://github.com/solution-dist/lib)

        - **`cli`** - Command-line tool

            > Includes `@je-es/cli` for CLI development
            >
            > Built-in argument parsing and command handling
            >
            > Example: [solution-dist/cli](https://github.com/solution-dist/cli)

        - **`server`** - Backend server application

            > Includes `@je-es/server` for server development
            >
            > Ready for API and backend services
            >
            > Example: [solution-dist/server](https://github.com/solution-dist/server)

        - **`web`** - Full-stack web application

            > Includes `@je-es/server` and `@je-es/client`
            >
            > Complete web application stack
            >
            > Example: [solution-dist/web](https://github.com/solution-dist/web)

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Templates

        > Each space type currently supports the **`clean`** template:

        - Minimal setup with essential tools

        - TypeScript configured

        - Build system ready (tsup)

        - Type-safe and production-ready

    <br>

- ## Configuration

    - ### `.space` File

        > Each space contains a `.space` configuration file that stores project metadata:

        ```json
        {
            "type"              : "cli",
            "template"          : "clean",
            "pm"                : "bun",

            "repo"              : {
                "org"           : "solution-lib",
                "name"          : "space",
                "version"       : "0.0.1",
                "desc"          : "Creates and manages the spaces",
                "kw"            : ["solution", "space", "framework"],
                "license"       : "MIT",
                "issues"        : "https://github.com/solution-lib/space/issues",
                "homepage"      : "https://github.com/solution-lib/space#readme",
                "git_url"       : "git+https://github.com/solution-lib/space.git"
            },

            "author"            : {
                "id"            : "maysara-elshewehy",
                "name"          : "Maysara",
                "email"         : "maysara.elshewehy@gmail.com",
                "url"           : "https://github.com/maysara-elshewehy"
            },

            "createdAt"         : "2025-11-29T01:22:48.497Z"
        }
        ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Key Features

        - **Automatic Configuration**: Space automatically manages your `package.json` with proper formatting
        
        - **Organization Support**: Create scoped packages with `@org/package-name` format
        
        - **GitHub Integration**: Automatic repository URLs and author links
        
        - **Consistent Formatting**: JSON files formatted with aligned colons and proper indentation

    <br>

- ## Advanced Usage

    - ### Creating Scoped Packages

        ```bash
        # Create a package under an organization
        space init @my-org/awesome-lib -t lib

        # During interactive mode, enter: @my-org/package-name
        space init
        # name: @my-org/package-name
        ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Using Current Directory

        ```bash
        # Create space in current directory (if folder name matches)
        mkdir my-project
        cd my-project
        space init my-project -t lib
        # Prompt: "Use current directory 'my-project' as the space root?" → Yes
        ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Test Workflows

        ```bash
        # Development with watch mode
        space test --watch

        # CI/CD with coverage
        space test --coverage --bail

        # Generate coverage for external tools
        space test --coverage --coverage-reporter=lcov

        # Debug specific tests
        space test -t "should handle errors" --bail

        # Performance testing
        space test --rerun-each 100 --concurrent
        ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Link Workflows

        ```bash
        # Link your library for local development
        cd my-lib
        space link              # Links globally

        cd ../my-app
        space link my-lib       # Links my-lib to this project

        # After development
        cd ../my-app
        space unlink my-lib     # Unlink from project

        cd ../my-lib
        space unlink            # Unlink globally
        ```
    
    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Publishing Workflow

        ```bash
        # 1. Update version in package.json
        # 2. Build and test
        space build
        space test --coverage

        # 3. Publish (interactive)
        space publish
        # Confirms: package name, version, tag, access level

        # Or publish directly
        space publish --access public

        # Beta releases
        space publish --tag beta
        ```

    <br>

- ## Requirements

    > **Bun** >= 1.3.3

    > **Git** (for template cloning)

    > **Node.js** (optional, for npm compatibility)

    <br>

- ## Documentation

    > Full documentation coming soon at [Github Pages](#)

    > For now, run `space --help` or check individual command help:

    ```bash
    space --help
    space init --help
    space test --help
    space publish --help
    ```

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ END ══════════════════════════════╗ -->

<br>

---

<div align="center">
    <a href="https://github.com/maysara-elshewehy"><img src="https://img.shields.io/badge/by-Maysara-black"/></a>
</div>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->