class AntigravitySuperpowers < Formula
  desc "Autonomous Superpowers & Specialized Division Skills for Google Antigravity & AI Agents"
  homepage "https://github.com/imMamdouhaboammar/antigravity-superpowers"
  url "https://github.com/imMamdouhaboammar/antigravity-superpowers/archive/refs/tags/v1.1.0.tar.gz"
  version "1.1.0"
  license "MIT"

  depends_on "oven-sh/bun/bun" => :recommended

  def install
    # Copy all files and skills into libexec
    libexec.install Dir["*"]

    # Generate executable wrappers for bun runtime
    (bin/"antigravity-superpowers").write <<~EOS
      #!/usr/bin/env bash
      BUN_BIN="$(which bun 2>/dev/null || echo "#{HOMEBREW_PREFIX}/bin/bun")"
      if [ ! -x "$BUN_BIN" ]; then
        echo "❌ Bun runtime required. Please run: brew install oven-sh/bun/bun" >&2
        exit 1
      fi
      exec "$BUN_BIN" "#{libexec}/bin/cli.ts" "$@"
    EOS
    chmod 0755, bin/"antigravity-superpowers"

    (bin/"agy-superpowers").write <<~EOS
      #!/usr/bin/env bash
      exec "#{bin}/antigravity-superpowers" "$@"
    EOS
    chmod 0755, bin/"agy-superpowers"
  end

  def caveats
    <<~EOS
      ⚡ Antigravity Superpowers installed successfully!

      To activate skills in your global and local environments, run:
        antigravity-superpowers install

      To install across all AI agents (Antigravity, Claude, Cursor, OpenCode, Windsurf, Cline):
        antigravity-superpowers install --all-agents

      To verify health:
        antigravity-superpowers verify
    EOS
  end

  test do
    assert_match "Antigravity Superpowers", shell_output("#{bin}/antigravity-superpowers help")
    assert_match "Total skills:", shell_output("#{bin}/antigravity-superpowers list")
  end
end
