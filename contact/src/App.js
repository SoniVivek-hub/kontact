import HomePage from "./components/HomePage";
import InputPagePlayers from "./components/InputPagePlayers";
import RoomPlayer from "./components/RoomPlayer";
import StartGame from "./components/StartGame";


function App() {
  return (
    <div className="App">
      <HomePage />
      <StartGame />
      <RoomPlayer />
      <InputPagePlayers />
    </div>
  );
}

export default App;
