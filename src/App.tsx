import { Benchmark } from "./components/Benchmark/Benchmark";
import GenericForm from "./components/GenericForm/GenericForm";

function App() {
  return (
    <>
      <Benchmark componentId="TestComponent">
      <GenericForm/>
      </Benchmark>
        {/* <TestComponent /> */}
    </>
  );
}

export default App;
