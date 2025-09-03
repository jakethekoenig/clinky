-- Get the current buffer
local buf = vim.api.nvim_get_current_buf()

-- Clear the buffer
vim.api.nvim_buf_set_lines(buf, 0, -1, false, {})

-- Set the new content
local new_content = {
  "New Front Content",
  "<!---split--->",
  "New Back Content"
}
vim.api.nvim_buf_set_lines(buf, 0, -1, false, new_content)

-- Save and quit
vim.cmd('wq')
