import { VscChromeMinimize, VscChromeMaximize, VscChromeClose } from "react-icons/vsc";
import { getCurrentWindow } from '@tauri-apps/api/window';

export default function TitleBar() {
  const appWindow = getCurrentWindow();

  return (
    <div className="titlebar">
      <div className="titlebar-drag-region" data-tauri-drag-region>
        YTMusic Downloader
      </div>
      <div className="titlebar-buttons">
        <div className="titlebar-button" onClick={() => appWindow.minimize()}>
          <VscChromeMinimize />
        </div>
        <div className="titlebar-button" onClick={() => appWindow.toggleMaximize()}>
          <VscChromeMaximize />
        </div>
        <div className="titlebar-button close" onClick={() => appWindow.close()}>
          <VscChromeClose />
        </div>
      </div>
    </div>
  );
}
