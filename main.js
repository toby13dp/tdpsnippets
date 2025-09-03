define(function (require, exports, module) {
  const AppInit            = brackets.getModule("utils/AppInit");
  const FileSystem         = brackets.getModule("filesystem/FileSystem");
  const ExtensionUtils     = brackets.getModule("utils/ExtensionUtils");
  const PreferencesManager = brackets.getModule("preferences/PreferencesManager");
  const CommandManager     = brackets.getModule("command/CommandManager");
  const Menus              = brackets.getModule("command/Menus");

  const CMD_ID   = "toby.emmetSnippets.install";
  const CMD_NAME = "Installeer Emmet-snippets (NL)";

  function ensureDir(dirPath, cb) {
    const dir = FileSystem.getDirectoryForPath(dirPath);
    dir.create(err => cb && cb(err && err !== "AlreadyExists" ? err : null));
  }

  function writeFile(targetPath, contents, cb) {
    const file = FileSystem.getFileForPath(targetPath);
    file.write(contents, cb);
  }

  function installSnippets() {
    // 1) Kies je gewenste gebruikersmap
    const userDir = "C:/Users/tobyd/EmmetCustom".replace(/\\/g, "/");
    const target  = userDir + "/snippets.json";

    // 2) Lees bundel-bestand
    return ExtensionUtils.loadFile(module, "snippets/snippets.json")
      .then(text => new Promise((resolve, reject) => {
        ensureDir(userDir, err => {
          if (err) { reject(err); return; }
          writeFile(target, text, err2 => err2 ? reject(err2) : resolve());
        });
      }))
      .then(() => {
        // 3) Update Emmet-instelling
        // NB: 'emmet' is de extensie-prefix; dit schrijft naar de globale prefs.
        const emmetPrefs = PreferencesManager.getExtensionPrefs("emmet");
        const current = emmetPrefs.get("extensionsPath") || [];
        const list = Array.isArray(current) ? current.slice() : [current];
        if (!list.includes(userDir)) list.push(userDir);
        emmetPrefs.set("extensionsPath", list);
        emmetPrefs.save();
        window.alert("Emmet-snippets geïnstalleerd. Herlaad Phoenix Code om ze te gebruiken.");
      })
      .catch(err => {
        console.error("Installatie mislukt:", err);
        window.alert("Kon snippets niet installeren. Check de console voor details.");
      });
  }

  AppInit.appReady(function () {
    CommandManager.register(CMD_NAME, CMD_ID, installSnippets);
    const menu = Menus.getMenu(Menus.AppMenuBar.DEBUG_MENU);
    if (menu) menu.addMenuItem(CMD_ID, Menus.LAST);
  });
});
