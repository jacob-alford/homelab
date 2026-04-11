{ inputs, ... }:
{
  flake.modules.homeManager.nixvim-complete = {
    imports = with inputs.self.modules.homeManager; [
      nixvim-base
      nixvim-colorscheme
      nixvim-keymaps
      nixvim-web-devicons
      nixvim-highlight-colors
      nixvim-telescope
      nixvim-lualine
      nixvim-treesitter
      nixvim-smart-splits
      nixvim-git-conflict
      nixvim-mini-completion
      nixvim-tiny-inline-diagnostic
      nixvim-notify
      nixvim-persistence
      nixvim-lint
      nixvim-neo-tree
      nixvim-lsp
      nixvim-barbar
      nixvim-alpha
    ];
  };

  flake.modules.darwin.nixvim-complete = {
    imports = with inputs.self.modules.darwin; [
      nixvim-base
      nixvim-colorscheme
      nixvim-keymaps
      nixvim-web-devicons
      nixvim-highlight-colors
      nixvim-telescope
      nixvim-lualine
      nixvim-treesitter
      nixvim-smart-splits
      nixvim-git-conflict
      nixvim-mini-completion
      nixvim-tiny-inline-diagnostic
      nixvim-notify
      nixvim-persistence
      nixvim-lint
      nixvim-neo-tree
      nixvim-lsp
      nixvim-barbar
      nixvim-alpha
    ];
  };
}
