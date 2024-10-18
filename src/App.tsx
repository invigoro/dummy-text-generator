import React from 'react';
import logo from './logo.svg';
import './App.css';
import './components/GenerateText'
import GenerateText from './components/GenerateText';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>Dummy Text Generator</p>
      </header>
      <div>
        <GenerateText />
      </div>
    </div>
  );
}

export default App;
