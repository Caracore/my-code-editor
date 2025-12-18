import logo from "../../assets/logo.png";
import "./WelcomeScreen.css";

export default function WelcomeScreen() {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <img src={logo} alt="My Code Editor" className="welcome-logo" />
        <h1 className="welcome-title">MY CODE EDITOR</h1>
        <p className="welcome-subtitle">Ouvrez un fichier ou un dossier pour commencer</p>
        <div className="welcome-shortcuts">
          <div className="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>O</kbd> <span>Ouvrir un fichier</span>
          </div>
          <div className="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>N</kbd> <span>Nouveau fichier</span>
          </div>
          <div className="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>S</kbd> <span>Sauvegarder</span>
          </div>
        </div>
      </div>
    </div>
  );
}
