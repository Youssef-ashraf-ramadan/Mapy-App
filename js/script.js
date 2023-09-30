'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, candence) {
    super(coords, distance, duration);
    this.candence = candence;
    this.calcPase();
    this._setDescription();
  }
  calcPase() {
    this.pase = this.duration / this.distance;
    return this.pase;
  }
}

class App {
  #zoomLevel = 13;
  #workouts = [];
  #map;
  #mapEvent;
  #form = document.querySelector('.form');
  #containerWorkouts = document.querySelector('.workouts');
  #inputType = document.querySelector('.form__input--type');
  #inputDistance = document.querySelector('.form__input--distance');
  #inputDuration = document.querySelector('.form__input--duration');
  #inputCadence = document.querySelector('.form__input--cadence');
  #inputElevation = document.querySelector('.form__input--elevation');
  #resetbtn = document.querySelector('.reset');
  #sortbtn = document.querySelector('.sort');
  constructor() {
    // get User's Position
    this._getPosition();

    // get data from localStorage
    this._getLocalStorage();

    // Attach event handlers
    this.#inputType.addEventListener('change', this._toggleElevationField);
    this.#form.addEventListener('submit', this._newWorkOut.bind(this));

    this.#containerWorkouts.addEventListener(
      'click',
      this._deleteItem.bind(this)
    );

    this.#containerWorkouts.addEventListener(
      'click',
      this._moveMarker.bind(this)
    );

    this.#resetbtn.addEventListener('click', this._reset.bind(this));
    this.#sortbtn.addEventListener('click', this._sortData.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('could not get your position');
        }
      );
    }
  }
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#zoomLevel);
    this.#map.on('click', this._showForm.bind(this));
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#workouts.forEach(work => {
      this._renderWorkOutMarker(work);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    this.#form.classList.remove('hidden');
    this.#inputDistance.focus();
  }
  _toggleElevationField() {
    document
      .querySelector('.form__input--elevation')
      .closest('.form__row')
      .classList.toggle('form__row--hidden');
    document
      .querySelector('.form__input--cadence')
      .closest('.form__row')
      .classList.toggle('form__row--hidden');
  }

  _newWorkOut(e) {
    e.preventDefault();
    let workout; // it will be assign with a new object created

    // get Date from Form
    const type = this.#inputType.value;
    const distance = +this.#inputDistance.value;
    const duration = +this.#inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    const latlngCoords = [lat, lng];
    // validtion form data
    const validtion = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const positive = (...inputs) => inputs.every(input => input > 0);

    if (type === 'running') {
      const cadence = +this.#inputCadence.value;
      // validtion
      if (
        !validtion(distance, duration, cadence) ||
        !positive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive Number');
      }
      workout = new Running(latlngCoords, distance, duration, cadence);
    }
    if (type === 'cycling') {
      const elevation = +this.#inputElevation.value;
      // validtion
      if (
        !validtion(distance, duration, elevation) ||
        !positive(distance, duration)
      ) {
        return alert('Inputs have to be positive Number');
      }
      workout = new Cycling(latlngCoords, distance, duration, elevation);
    }
    // add new  object to workouts array
    this.#workouts.push(workout);
    // Render Workout on map as marker
    this._renderWorkOutMarker(workout);
    // Render Workout on list
    this._renderWorkOutList(workout);

    // show delete btn
    this._showDeleteBtn();

    //show sort btn
    this._showsortBtn();

    // hide form
    this._hideForm();
    // save data in local Storage
    this._setLocalStorage();
  }

  _renderWorkOutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          minWidth: 100,
          maxWidth: 250,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        ` ${workout.type === 'cycling' ? '🚴‍♀️' : '🏃‍♂️'} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkOutList(workout) {
    const check = workout.type === 'cycling';
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__btns">
            <button class="workout__btn workout__btn--delete">
              <i class="fa-solid fa-trash deleteItem"></i>
            </button>
   </div>

    <div class="workout__details">
      <span class="workout__icon">${check ? '🚴‍♀️' : '🏃‍♂️'}</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${
        check ? `${workout.speed.toFixed(2)}` : `${workout.pase.toFixed(2)}`
      }</span>
     <span class="workout__unit">${check ? 'km/h' : 'min/km'}</span>
    </div>
    <div class="workout__details">
    <span class="workout__icon">${check ? '⛰' : '🦶🏼'}</span>
      <span class="workout__value">${
        check ? `${workout.elevationGain}` : `${workout.candence}`
      }</span>
      <span class="workout__unit">m</span>
    </div>
   
  </li> `;
    this.#containerWorkouts.insertAdjacentHTML('beforeend', html);
  }
  _hideForm() {
    // clear form inputs
    // prettier-ignore
    this.#inputCadence.value = this.#inputDistance.value = this.#inputElevation.value = this.#inputDuration.value = '';
    //hidden form
    this.#form.style.display = 'none';
    this.#form.classList.add('hidden');
    setTimeout(() => (this.#form.style.display = 'grid'), 1000);
  }
  _moveMarker(e) {
    const workOutEl = e.target.closest('.workout');
    if (!workOutEl) return;
    const currentWorkOut = this.#workouts.find(
      el => el.id === workOutEl.dataset.id
    );

    this.#map.setView(currentWorkOut.coords, this.#zoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  // load localStorage data into html
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkOutList(work);
    });
    if (this.#workouts.length > 0) {
      this._showDeleteBtn();
      this._showsortBtn();
    }
  }

  // remove all localStorage data
  _reset() {
    localStorage.removeItem('workouts');
    this.#workouts = [];
    location.reload();
  }
  _showDeleteBtn() {
    this.#resetbtn.classList.remove('reset-hidden');
  }
  _showsortBtn() {
    this.#sortbtn.classList.remove('sort-hidden');
  }

  // delete item when click on delete icon
  _deleteItem(e) {
    if (e.target.classList.contains('deleteItem')) {
      const currentEl = e.target.closest('.workout');
      const currentWorkOut = this.#workouts.findIndex(
        el => el.id === currentEl.dataset.id
      );
      this.#workouts.splice(currentWorkOut, 1);
      this._setLocalStorage();
      location.reload();
    }
  }

  // sort data based on duration in ASC order
  _sortData() {
    this.#workouts.sort((a, b) => a.duration - b.duration);
    this._setLocalStorage();
    this.#containerWorkouts.textContent = ``;
    location.reload();
    this.#workouts.forEach(work => {
      this._renderWorkOutList(work);
    });
  }
}

const app = new App();
