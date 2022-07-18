// hide the flashing message after 6 seconds
const hideElement = () => {
  let message = document.getElementsByClassName("alert")[0];
  if (!message) {
    return;
  } else {
    setTimeout(hideElement, 6000);
    function hideElement() {
      message.style.display = "none";
    }
  }
};

hideElement();
