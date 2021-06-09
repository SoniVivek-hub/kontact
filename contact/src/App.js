import HomePage from "./components/HomePage";
import InputPagePlayers from "./components/InputPagePlayers";
import RoomPlayer from "./components/RoomPlayer";
import StartGame from "./components/StartGame";
import GameSpace from "./components/GameSpace";
import { io } from "socket.io-client";
import {Route,BrowserRouter as Router,Link,Switch,Redirect,} from "react-router-dom"


const socket = io.connect("/");

function App() {
  return (
    <Router>
      <Switch>
          <Route exact path="/">
            <HomePage socket={socket} />
          </Route>
          <Route exact path="/startgame">
            <StartGame socket={socket} />
          </Route>  
          <Route exact path="/inputpageplayer">
            <InputPagePlayers socket={socket} />
          </Route>  
          <Route exact path="/roomplayer">
            <RoomPlayer socket={socket} />
          </Route>  
          <Route exact path="/gamespace">
            <GameSpace socket={socket} />
          </Route>  
        </Switch>
      </Router>
  );
}

export default App;
