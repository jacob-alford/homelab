let
  nixvimConfig =
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

        extraConfigLua = ''
          function _G.format_with_dprint_priority()
            local clients = vim.lsp.get_clients({ bufnr = 0 })
            local has_dprint = false
            for _, c in ipairs(clients) do
              if c.name == "dprint" then
                has_dprint = true
                break
              end
            end
            vim.lsp.buf.format({
              async = true,
              filter = function(client)
                if has_dprint then
                  return client.name == "dprint"
                end
                local disallowed = { ts_ls = true, astro = true }
                return not disallowed[client.name]
              end,
            })
          end
        '';

        keymaps = [
          {
            action = "<cmd>Neotree toggle<CR>";
            key = "<leader>e";
          }

          {
            action = "<cmd>lua _G.format_with_dprint_priority()<CR>";
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

          highlight-colors = {
            enable = true;
            settings = {
              enable_named_colors = true;
            };
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
            };
          };

          persistence.enable = true;

          lint = {
            enable = true;
            lintersByFt = {
              text = [ "vale" ];
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
              popup_border_style = "rounded";
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
            inlayHints = true;
            servers = {
              ts_ls.enable = true;
              eslint = {
                package = pkgs.eslint;
                packageFallback = true;
                enable = false;
              };
              cssls.enable = true;
              tailwindcss.enable = true;
              html.enable = true;
              astro.enable = true;
              phpactor.enable = true;
              svelte.enable = false;
              pyright.enable = true;
              marksman.enable = true;
              nil_ls = {
                enable = true;
                settings.nix.flake.autoArchive = true;
              };
              dockerls.enable = true;
              bashls.enable = true;
              clangd.enable = true;
              yamlls.enable = true;

              lua_ls = {
                enable = true;
                settings.telemetry.enable = false;
              };

              rust_analyzer = {
                enable = true;
                installRustc = true;
                installCargo = true;
              };

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
                extraOptions = {
                  init_options = {
                    plugins = with pkgs.dprint-plugins; [
                      "${dprint-plugin-typescript}/plugin.wasm"
                      "${dprint-plugin-json}/plugin.wasm"
                      "${dprint-plugin-markdown}/plugin.wasm"
                      "${dprint-plugin-toml}/plugin.wasm"
                      "${g-plane-malva}/plugin.wasm"
                      "${g-plane-markup_fmt}/plugin.wasm"
                      "${g-plane-pretty_yaml}/plugin.wasm"
                    ];
                  };
                };
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
    };
in
{
  flake.modules.homeManager.nixvim = nixvimConfig;
  flake.modules.darwin.nixvim = nixvimConfig;
}
