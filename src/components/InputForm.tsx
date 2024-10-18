
import { Language, Jumble } from "../functions/generateText";
import { useState } from 'react';


function InputForm(formSubmit: any,) {
    const [lang, setLang] = useState(Language.ENGLISH);
    const [jumble, setJumble] = useState(Jumble.NONE);
    const textLength = 2000; //words
        const availableLanguages = Object.keys(Language);
        return (
            <form onSubmit={formSubmit}>
              <RadioSelector options={availableLanguages} selector={"Language"}/>
              <div>
                Selected option is : {selector}
              </div>
              <button className="btn btn-default" type="submit">
                Submit
              </button>
            </form>
          );
    
}



const RadioSelector = ({options: string[], selector: string}) =>
     {
    
    return (
        <div>
            {options.map((item, index) => (
                <div className="radio">
                    <label>
                    <input
              type="radio"
              value={item}
              checked={selector === item}
            />
            Male
          </label>
        </div>
            ))}
        <div>
          Selected option is : {selector}
        </div>
        </div>
    );
}

export default InputForm;