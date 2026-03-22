{
  inputs,
  lib,
  config,
  pkgs,
  ...
}:
{
  programs.nixvim = {
    enable = true;

    nixpkgs = {
      config = {
        allowUnfree = true;
      };
    };

    globalOpts = {
      number = true;
      relativenumber = true;

      signcolumn = "yes";

      tabstop = 2;
      shiftwidth = 2;
      expandtab = true;
      smarttab = true;

      cursorline = true;

      wrap = false;
    };

    globals.mapleader = " ";

    keymaps = [
      {
        action = "<cmd>Neotree toggle<CR>";
        key = "<leader>e";
      }

      {
        action = "<cmd>lua vim.lsp.buf.format({ async = true, filter = function(client) local disallowed = { ts_ls = true, astro = true }; return not disallowed[client.name] end })<CR>";
        key = "<C-f>";
        options.desc = "Format code";
      }

      {
        action = "K";
        key = "<leader>t";
        options.desc = "Show type signature";
      }

      {

        mode = [ "n" ];
        key = "<C-s>";
        action = ":w<CR>";
        options.desc = "Save file";
      }

      {
        mode = [ "i" ];
        key = "<C-s>";
        action = "<Esc>:w<CR>i";
        options.desc = "Save file";
      }

      {
        mode = [ "v" ];
        key = "<C-s>";
        action = "<Esc>:w<CR>v";
        options.desc = "Save file";
      }

      {
        key = "<C-v>";
        mode = "i";
        action = "<C-r>+";
        options.desc = "Paste from clipboard";
      }

      {
        key = "<C-S-v>";
        mode = [
          "n"
          "v"
        ];
        action = ''"+p'';
        options.desc = "Paste from clipboard";
      }

      {
        key = "<C-q>";
        mode = [
          "n"
          "i"
          "v"
        ];
        action = "<Esc>:wq<CR>";
        options.desc = "Save and quit";
      }

      {
        key = "<C-w>";
        mode = [
          "n"
          "i"
          "v"
        ];
        action = "<CMD>BufferClose<CR>";
        options.desc = "Close current tab";
        options.silent = true;
        options.nowait = true;
      }

      {
        key = "\\";
        mode = [
          "n"
        ];
        action = "<CMD>split<CR>";
        options.desc = "Split horizontal";
      }

      {
        key = "|";
        mode = [
          "n"
        ];
        action = "<CMD>vsplit<CR>";
        options.desc = "Split vertical";
      }

      {
        key = "<leader>o";
        mode = "n";
        action = ":on<CR>";
        options.desc = "Remove all splits but active split";
      }

      {
        key = "<C-h>";
        mode = [
          "n"
        ];
        action = "<cmd>lua require('smart-splits').resize_left()<CR>";
      }

      {
        key = "<C-j>";
        mode = [
          "n"
        ];
        action = "<cmd>lua require('smart-splits').resize_down()<CR>";
      }
      {
        key = "<C-k>";
        mode = [
          "n"
        ];
        action = "<cmd>lua require('smart-splits').resize_up()<CR>";
      }
      {
        key = "<C-l>";
        mode = [
          "n"
        ];
        action = "<cmd>lua require('smart-splits').resize_right()<CR>";
      }
    ];

    colorschemes.catppuccin = {
      enable = true;
      settings = {
        flavor = "frappe";
        integrations = {
          notify = true;
          neotree = true;
          treesitter = true;
          treesitter_context = true;
          native_lsp = {
            enabled = true;
            inlay_hints = {
              background = true;
            };
            underlines = {
              errors = [ "underline" ];
              hints = [ "underline" ];
              information = [ "underline" ];
              warnings = [ "underline" ];
            };
          };
        };
      };
    };

    plugins = {
      web-devicons = {
        enable = true;
        settings = {
          strict = true;
          color_icons = true;
          variant = "dark";
        };
        autoLoad = true;
      };

      telescope = {
        enable = true;
        keymaps = {
          "<C-p>" = "find_files";
          "<C-f>" = "live_grep";
          "<C-S-f>" = "grep_string";
        };
      };

      lualine = {
        enable = true;
      };

      treesitter = {
        enable = true;
      };

      ts-autotag = {
        enable = true;
      };

      smart-splits = {
        enable = true;
      };

      git-conflict = {
        enable = true;
      };

      mini-completion = {
        enable = true;
      };

      tiny-inline-diagnostic = {
        enable = true;
        settings = {
          preset = "modern";
          option.use_icons_from_diagnostic = true;
        };
      };

      notify = {
        enable = true;
        settings = {
          top_down = true;
          fps = 60;
          render = "default";
          timeout = 500;
        };
      };

      persistence.enable = true;

      lint = {
        enable = true;
        lintersByFt = {
          text = [ "vale" ];
          # json = [ "jsonlint" ];
          markdown = [ "vale" ];
          rst = [ "vale" ];
          ruby = [ "ruby" ];
          dockerfile = [ "hadolint" ];
          terraform = [ "tflint" ];
        };
      };

      neo-tree = {
        enable = true;
        settings = {
          popup_border_style = "rounded"; # Type: null or one of “NC”, “double”, “none”, “rounded”, “shadow”, “single”, “solid” or raw lua code
          enable_diagnostics = true;
          enable_git_status = true;
          enable_modified_markers = true;
          enable_refresh_on_write = true;
          close_if_last_window = true;
          window = {
            width = 40;
            height = 15;
            autoExpandWidth = false;
            mappings = {
              "<space>" = "none";
            };
          };
          buffers = {
            bind_to_cwd = false;
            follow_current_file = {
              enabled = true;
            };
          };
        };
      };

      lsp = {
        enable = true;
        # --- not available in 24.05 ---
        inlayHints = true;
        servers = {
          # Average webdev LSPs
          ts_ls.enable = true; # TS/JS
          eslint.enable = true;
          cssls.enable = true; # CSS
          tailwindcss.enable = true; # TailwindCSS
          html.enable = true; # HTML
          astro.enable = true; # AstroJS
          phpactor.enable = true; # PHP
          svelte.enable = false; # Svelte
          # Not supported in 25.11 :(
          # vuels.enable = false; # Vue
          volar.enable = true;
          pyright.enable = true; # Python
          marksman.enable = true; # Markdown
          nil_ls.enable = true; # Nix
          dockerls.enable = true; # Docker
          bashls.enable = true; # Bash
          clangd.enable = true; # C/C++
          # csharp_ls not good for darwin
          # csharp_ls.enable = true; # C#
          yamlls.enable = true; # YAML

          lua_ls = {
            # Lua
            enable = true;
            settings.telemetry.enable = false;
          };

          # Rust
          rust_analyzer = {
            enable = true;
            installRustc = true;
            installCargo = true;
          };

          # Formatting
          dprint = {
            enable = true;
            filetypes = [
              "typescript"
              "typescriptreact"
              "javascript"
              "javascriptreact"
              "json"
              "astro"
            ];
          };
        };
      };

      barbar = {
        enable = true;
        autoLoad = true;
      };

      alpha = {
        enable = true;
        theme = "dashboard";
      };
    };
  };
}
