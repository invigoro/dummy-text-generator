import React from 'react';
import { generateText, Language } from '../functions/generateText';

function GenerateText() {

    let LoremIpsum = generateText(Language.GERMAN);

  return (
    <div className="GeneratedText">
        {LoremIpsum}
    </div>
  );
}

export default GenerateText;
