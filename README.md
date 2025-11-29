<!-- ╔══════════════════════════════ BEG ══════════════════════════════╗ -->

<br>
<div align="center">
    <p>
        <img src="./assets/img/logo.png" alt="logo" style="" height="70" />
    </p>
</div>

<div align="center">
    <img src="https://img.shields.io/badge/v-0.0.4-black"/>
    <a href="https://github.com/maysara-elshewehy">
    </a>
    <a href="https://github.com/solution-lib"><img src="https://img.shields.io/badge/🔥-@solution--lib-black"/></a>
</div>

<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
    <br>
</div>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ DOC ══════════════════════════════╗ -->

- ## Quick Start 🔥

    ```bash
    # install via bun or npm
    bun install -g @solution-lib/space

    # Now use 'space' anywhere
    space --help
    ```

    ```bash
    # Create a new space (interactive)
    space init

    # Or with options
    space init my-lib --type lib --pm bun --desc "My library"

    # Navigate and setup
    cd my-lib
    space i         # or `space install`
    space build
    ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## Commands

    ```bash
    # Space Management
    space init [name]              # Create new space (interactive)
    space info                     # Show space information

    # Package Manager (Bun/npm wrapper)
    space install [packages...]    # Install dependencies
    space i [packages...]          # Alias for install
    space remove <packages...>     # Remove packages (with confirmation)
    space r <packages...>          # Alias for remove
    space update [packages...]     # Update packages (interactive)
    space up [packages...]         # Alias for update
    space link                     # Link package globally
    space unlink                   # Unlink package
    space list                     # List installed packages
    space ls                       # Alias for list
    space run <script>             # Run scripts from `package.json` file

    # Build & Development
    space build                    # Build the project
    space start                    # Build and start
    space test                     # Run tests
    space clean                    # Clean build artifacts

    # Publishing
    space publish                  # Publish to npm (interactive)
    ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## Space Types

    **Library (lib)**
    ```
    my-lib/
    ┣ src/
    ┃ ┣ ...
    ┃ ┗ main.ts
    ┣ test/
    ┣ dist/
    ┣ .space
    ┗ package.json
    ```

    **CLI Tool (cli)**
    ```
    my-cli/
    ┣ src/
    ┃ ┣ ...
    ┃ ┗ main.ts
    ┣ test/
    ┣ dist/
    ┣ .space
    ┗ package.json
    ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## Examples

    **Create and publish a library:**
    ```bash
    space init math-utils --type lib --pm bun
    cd math-utils
    space install
    space start            # Build and Start
    space test             # Run tests
    space build            # Build for production
    space link             # Test locally
    space publish          # Publish to npm
    ```

    **Create a CLI tool:**
    ```bash
    space init my-tool --type cli
    cd my-tool
    space i chalk inquirer  # Add dependencies
    space start             # Test your CLI
    space link              # Make it global
    my-tool --help          # Use it!
    ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## Configuration

    > Each space contains a `.space` configuration file:

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

    > Space automatically uses the correct package manager based on this config.

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## Documentation

    > Full documentation coming soon at [Github Pages](#)

    > For now, run `space --help` or check the [detailed guide](#).


<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ END ══════════════════════════════╗ -->

<br>
<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
    <br>
</div>
<br>
<div align="center">
    <a href="https://github.com/maysara-elshewehy"><img src="https://img.shields.io/badge/by-Maysara-black"/></a>
</div>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->