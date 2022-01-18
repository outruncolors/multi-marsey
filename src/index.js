import "./styles.css";
import { initialize, load } from "./game";

document.getElementById("app").innerHTML = `
  <div id="game"></div>
  <button id="load">Load Assets</button>
`;

const loadButton = document.getElementById("load");

loadButton.onclick = () =>
  load()
    .then(initialize)
    .then(() => loadButton.remove());
