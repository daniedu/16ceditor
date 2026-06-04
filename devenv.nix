{ pkgs, ... }: {
  packages = [ pkgs.pnpm pkgs.nodejs ];
  scripts.launch.exec = ''
    # Launch your tabs
    kitten @ launch --type=tab --tab-title="dev" --cwd=current fish -c "direnv export fish | source; pnpm dev; fish"
    kitten @ launch --type=tab --tab-title="opencode" --cwd=current fish -c "direnv export fish | source; opencode; fish"
    kitten @ launch --type=tab --tab-title="nvim" --cwd=current fish -c "direnv export fish | source; nvim .; fish"
  '';
}
