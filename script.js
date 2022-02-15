"use strict"; //With strict mode, you cannot used undeclared variables.

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  // Keeping track of number of clicks when user clicks on a workout
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // Comment tells prettier to ignore next line, better formatting
    // prettier-ignore
    const months = [
      "January", "February", "March", "April", "May", "June", "July", "August",
      "September", "October", "November", "December"];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on 
      ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

// extend used to create a class that is a child of another class
// constructor inherits properties from Parent class
// super is used to access and call functions on an objects parent
class Running extends Workout {
  type = "running";

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/mil
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // mil/hour
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

///////////////////////////////////////////////////////
// APPLICATION

//querySelector() method allows you to select the firs element that matches one or more CSS selectors
const form = document.querySelector("form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form_input--type");
const inputDistance = document.querySelector(".form_input--distance");
const inputDuration = document.querySelector(".form_input--duration");
const inputCadence = document.querySelector(".form_input--cadence");
const inputElevation = document.querySelector(".form_input--elevation");

class App {
  // private instance properties
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  //   Variable for holding workouts being pushed
  #workouts = [];

  // The constuctor method is a method for creating and initializing an object
  constuctor() {
    //   get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // this._newWorkout is eventHandler function
    // add bind() so this is not pointing to 'form'
    form.addEventListener("submit", this._newWorkout.bind(this));
    // EventListener to change form input to 'Elevation Gain' when cycling is selected, and 'Cadence' when running is selected
    inputType.addEventListener("change", this._toggleElevationField);

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    // getCurrentPosition takes two calling functions (successCallBack & errorCallBack)
    // destructuring allows us to extract data from arrays, objects, maps and set them to new variables
    if (navigator.geolocation)
      // add bind function to _loadMap so this is not returning 'undefined'
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not get your position");
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(latitude, longitude);

    // create a new variable containing lat and long
    const coords = [latitude, longitude];

    // element in index.html must have an id of 'map'
    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Leaflet version of addEventListener
    // adds Event to the variable 'map' pulling new coords on click
    // add bind() so 'this' is not pointing to map
    // Handling Clicks on map
    this.#map.on("click", this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });  
  }
  // Methods with underscore indicate private methods, can't be accessed directly
  _showForm(mapE) {
    // Set parameter mapE equal to mapEvent
    this.#mapEvent = mapE;
    // removes hidden form to input workout
    form.classList.remove("hidden");
    //    adds focus to distance input field; i.e. field is already selected
    inputDistance.focus();
  }

  _hideForm() {
    // Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";

    // Animation to replace input field with wortout results after submission, hides form again
    form.style.display = "none";
    form.classList.remove("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest(".form_row").classList.toggle("form_row--hidden");
    inputCadence.closest(".form_row").classList.toggle("form_row--hidden");
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    e.preventDefault();

    //////// Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //////// If workout running, create running object
    if (type === "running") {
      const cadence = +inputCadence.value;
      // Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("Inputs have to be positive numbers!");

      workout = new Running([lat, lng], distance, duration, cadence);
      //   Adds workouts to #workout variable
      this.#workouts.push(workout);
    }
    //////// If workout cycling, create cycling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;

      // Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(elevation)
        !validInputs(distance, duration, elevation) ||
        // Only interested in distance and duration here cause elevation can be negative
        !allPositive(distance, duration)
      )
        return alert("Inputs have to be positive numbers!");
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //////// Add new object to workout array
    this.#workouts.push(workout);
    //////// Render workout on map as marker
    this._renderWorkoutMarker(workout);
    //////// Render workout on list
    this._renderWorkout(workout);
    ///////// Hide form + Clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    // Display Marker
    // new variable representing the lat and long of click position
    // Moved marker inside EventListener, puts a new marker wherever you click
    // add map variable to addTo
    // Looking at leaflet docs for bindPopup() marker options: add max and min width, autoclose, closeOnClick and className to add CSS
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${type}-popup`,
        })
      )
      // add setPopupContent - adds text to marker
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
              <span class="workout__icon">${
                workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
              }</span>
              <span class="workout__value">${workout.distance}</span>
              <span class="workout__unit">mi</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">⏱</span>
              <span class="workout__value">${workout.duration}</span>
              <span class="workout__unit">min</span>
            </div>
    `;

    if (workout.type === "running")
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/mi</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
        </li>
      `;

    if (workout === "cycling")
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">mi/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">ft</span>
        </div>
        </li>
      `;

    //  This method inserts a text as HTML into a specified position
    // afterend = After the element
    form.insertAdjacentHTML("afterend", html);
  }
  _moveToPopup(e) {
    // the closest() method traverses the element and its parents until it finds a node that matches the provided selector string
    const workoutElement = e.target.closest('.workout');

    if(!workoutElement) return;

    const workout= this.#workouts.find(work => work.id === workoutElement.dataset.id);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      }
    });

    // using the public interface
    // workout.click();
  }

  _setLocalStorage() {
    // Local API that the browser provides
    // Advised to only use for small amounts of data, as local storage is Blocking
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    // JSON.parse converts string to an object
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });  
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
