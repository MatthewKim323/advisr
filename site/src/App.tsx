import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Thesis from "./components/Thesis";
import Office from "./components/Office";
import Roster from "./components/Roster";
import Memory from "./components/Memory";
import Flow from "./components/Flow";
import Manifesto from "./components/Manifesto";
import Footer from "./components/Footer";

function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Thesis />
        <Office />
        <Roster />
        <Memory />
        <Flow />
        <Manifesto />
      </main>
      <Footer />
    </>
  );
}

export default App;
