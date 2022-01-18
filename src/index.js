import "./styles.css";
import { initialize, load } from "./game";

document.getElementById("app").innerHTML = `
  <div id="game"></div>
  <button id="load">Load Assets</button>
`;

document.getElementById("load").onclick = () => load().then(initialize);
