import Login from './components/Login';

function App() {
  return (
    <div>
      <h1>UniMeet</h1>
      <Login />
      {/* Később itt jön a routing (React Router), 
          hogy a Login, Register, Feed stb. oldalak között váltsunk */}
    </div>
  );
}

export default App;