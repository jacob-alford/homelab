let
  toggleFileTree = {
    key = "<leader>e";
    action = "<cmd>Neotree toggle<CR>";
  };

  formatCode = {
    key = "<C-f>";
    action = "<cmd>lua _G.format_with_dprint_priority()<CR>";
    options.desc = "Format code";
  };

  showTypeSignature = {
    key = "<leader>t";
    action = "K";
    options.desc = "Show type signature";
  };

  saveNormal = {
    mode = [ "n" ];
    key = "<C-s>";
    action = ":w<CR>";
    options.desc = "Save file";
  };

  saveInsert = {
    mode = [ "i" ];
    key = "<C-s>";
    action = "<Esc>:w<CR>i";
    options.desc = "Save file";
  };

  saveVisual = {
    mode = [ "v" ];
    key = "<C-s>";
    action = "<Esc>:w<CR>v";
    options.desc = "Save file";
  };

  pasteInsert = {
    key = "<C-v>";
    mode = "i";
    action = "<C-r>+";
    options.desc = "Paste from clipboard";
  };

  pasteFromClipboard = {
    key = "<C-S-v>";
    mode = [ "n" "v" ];
    action = ''"+p'';
    options.desc = "Paste from clipboard";
  };

  saveAndQuit = {
    key = "<C-q>";
    mode = [ "n" "i" "v" ];
    action = "<Esc>:wq<CR>";
    options.desc = "Save and quit";
  };

  closeTab = {
    key = "<C-w>";
    mode = [ "n" "i" "v" ];
    action = "<CMD>BufferClose<CR>";
    options.desc = "Close current tab";
    options.silent = true;
    options.nowait = true;
  };

  splitHorizontal = {
    key = "\\";
    mode = [ "n" ];
    action = "<CMD>split<CR>";
    options.desc = "Split horizontal";
  };

  splitVertical = {
    key = "|";
    mode = [ "n" ];
    action = "<CMD>vsplit<CR>";
    options.desc = "Split vertical";
  };

  closeOtherSplits = {
    key = "<leader>o";
    mode = "n";
    action = ":on<CR>";
    options.desc = "Remove all splits but active split";
  };

  resizeLeft = {
    key = "<C-h>";
    mode = [ "n" ];
    action = "<cmd>lua require('smart-splits').resize_left()<CR>";
  };

  resizeDown = {
    key = "<C-j>";
    mode = [ "n" ];
    action = "<cmd>lua require('smart-splits').resize_down()<CR>";
  };

  resizeUp = {
    key = "<C-k>";
    mode = [ "n" ];
    action = "<cmd>lua require('smart-splits').resize_up()<CR>";
  };

  resizeRight = {
    key = "<C-l>";
    mode = [ "n" ];
    action = "<cmd>lua require('smart-splits').resize_right()<CR>";
  };

  module =
    { ... }:
    {
      programs.nixvim = {
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
          toggleFileTree
          formatCode
          showTypeSignature
          saveNormal
          saveInsert
          saveVisual
          pasteInsert
          pasteFromClipboard
          saveAndQuit
          closeTab
          splitHorizontal
          splitVertical
          closeOtherSplits
          resizeLeft
          resizeDown
          resizeUp
          resizeRight
        ];
      };
    };
in
{
  flake.modules.homeManager.nixvim-keymaps = module;
  flake.modules.darwin.nixvim-keymaps = module;
}
