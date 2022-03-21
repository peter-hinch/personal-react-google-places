import { useState, useEffect, useRef } from 'react';

// Using the Google Places Autocomplete API from the following example.
// Reference: https://betterprogramming.pub/the-best-practice-with-google-place-autocomplete-api-on-react-939211e8b4ce

let autoComplete;

const loadScript = (url, callback) => {
  let script = document.createElement('script');
  script.type = 'text/javascript';

  if (script.readyState) {
    script.onreadystatechange = function () {
      if (script.readyState === 'loaded' || script.readyState === 'complete') {
        script.onreadystatechange = null;
        callback();
      }
    };
  } else {
    script.onload = () => callback();
  }

  script.src = url;
  document.getElementsByTagName('head')[0].appendChild(script);
};

function PlacesAutocomplete() {
  const [query, setQuery] = useState('');
  const [currentInfo, setCurrentInfo] = useState({});
  const autoCompleteRef = useRef(null);

  useEffect(() => {
    loadScript(
      `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_PLACES_API_KEY}&libraries=places`,
      () => handleScriptLoad(setQuery, autoCompleteRef)
    );
  }, []);

  function handleScriptLoad(updateQuery, autoCompleteRef) {
    autoComplete = new window.google.maps.places.Autocomplete(
      autoCompleteRef.current,
      { types: ['establishment'] }
    );
    autoComplete.setFields([
      'place_id',
      'geometry',
      'name',
      'website',
      'photos',
      'formatted_address',
      'formatted_phone_number',
      'opening_hours',
      'url'
    ]);
    autoComplete.addListener('place_changed', () =>
      handlePlaceSelect(updateQuery)
    );
  }

  async function handlePlaceSelect(updateQuery) {
    const addressObject = autoComplete.getPlace();
    const query = addressObject.formatted_address;
    updateQuery(query);
    console.log(addressObject);
    setCurrentInfo(addressObject);
  }

  const parseAttributes = (attributions) => {
    // Regular expression for extracting url and name from provided HTML object.
    // This avoids the need for using dangerouslySetInnerHTML in React:
    // 1st group: link url
    // 2nd group: contributor name
    let regex = /^<a href="(.*?)">(.*?)<\/a>$/;

    // Check that the array given for attributions contains an object.
    if (attributions.length > 0) {
      let string = attributions[0].toString();
      // Use the regex to obtain two groups and assign them to the array 'components'.
      let components = string.match(regex);
      // Return a link in JSX format.
      return <a href={components[1]}>Image: {components[2]}</a>;
    } else {
      // If there were no attributions present, return an empty React fragment.
      return <></>;
    }
  };

  return (
    <div>
      <div className="search-location-input">
        <input
          ref={autoCompleteRef}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Enter an establishment"
          value={query}
          style={{
            boxSizing: 'border-box',
            width: '600px'
          }}
        />
      </div>
      {Object.keys(currentInfo).length !== 0 ? (
        <div>
          <h2>{currentInfo.name}</h2>
          <p>
            <a href={currentInfo.website}>Website</a>
          </p>
          {currentInfo.hasOwnProperty('photos') ? (
            /* When using images returned by the Places API, if an attribution */
            /* exists for that image it must be displayed with the result. */
            <>
              <div>
                <img
                  src={currentInfo.photos[0].getUrl()}
                  alt={currentInfo.name}
                  width="600"
                />
              </div>
              <small>
                <em>
                  {parseAttributes(currentInfo.photos[0].html_attributions)}
                </em>
              </small>
            </>
          ) : (
            <></>
          )}
          <p>{currentInfo.formatted_address}</p>
          <p>{currentInfo.formatted_phone_number}</p>
          {currentInfo.hasOwnProperty('opening_hours') ? (
            <>
              <p>{currentInfo.opening_hours.isOpen ? 'Open Now' : 'Closed'}</p>
              <ul>
                {currentInfo.opening_hours.weekday_text.map((weekday) => (
                  <li>{weekday}</li>
                ))}
              </ul>
            </>
          ) : (
            <></>
          )}
          {/* Results returned by the Google Places API must have a link to the */}
          {/* Google Business Profile for that result. */}
          <small>
            <a href={currentInfo.url}>
              Google Business Profile for {currentInfo.name}
            </a>
          </small>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

export default PlacesAutocomplete;
