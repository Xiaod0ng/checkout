var payButton = document.getElementById("pay-button");
var form = document.getElementById("payment-form");
var errorStack = [];

Frames.init({
  publicKey: "pk_sbox_yhnqetltlhjsubv7nrmljlapvqb",
  modes: [Frames.modes.DISABLE_COPY_PASTE],
  localization: "ZH-HK",
  //   localization: {
  //     cardNumberPlaceholder: "卡号",
  //     expiryMonthPlaceholder: "月",
  //     expiryYearPlaceholder: "年",
  //     cvvPlaceholder: "CVV",
  //   },
});

// Only enable the payment button when the payment form is valid
Frames.addEventHandler(
  Frames.Events.CARD_VALIDATION_CHANGED,
  () => (payButton.disabled = !Frames.isCardValid())
);

// Intercept the event and let Frames to tokenize the card
form.addEventListener("submit", function (event) {
  event.preventDefault();

  // Add card holder name and other information
  Frames.cardholder = {
    name: "Xiaodong Yu",
    billingAddress: {
      addressLine1: "123 Main Street",
      addressLine2: "Apartment 4",
      zip: "12345",
      city: "London",
      state: "London",
      country: "GB",
    },
    phone: "1234567890",
  };

  Frames.submitCard();
});

// When the tokenization is completed retrieve the card token and send to to the server to complete a payment
Frames.addEventHandler(Frames.Events.CARD_TOKENIZED, (event) => {
  // Send the token to the server to complete the payment
  console.log(event.token);
  http(
    {
      method: "POST",
      route: "/pay",
      body: {
        token: event.token, // the card token
      },
    },
    // This function is called after the server code is executed
    (myApiResponse) => {
      console.log(myApiResponse);
      var el = document.querySelector(".payment-message");
      el.innerHTML =
        `Payment outcome: <span class="payment-response">${myApiResponse.response_summary}</span>` +
        '<br><span class="hint">Full response in the console</span>';
    }
  );
});

// In case the tokenization fails, allow the customer to enter new card details
Frames.addEventHandler(Frames.Events.CARD_TOKENIZATION_FAILED, () => {
  Frames.enableSubmitForm();
});

// when the validation changes, show appropriate error messages
Frames.addEventHandler(Frames.Events.FRAME_VALIDATION_CHANGED, (event) => {
  var errorMessageElement = document.querySelector(".error-message");
  var hasError = !event.isValid && !event.isEmpty;

  if (hasError) {
    errorStack.push(event.element);
  } else {
    errorStack = errorStack.filter(function (element) {
      return element !== event.element;
    });
  }

  var errorMessage = errorStack.length
    ? getErrorMessage(errorStack[errorStack.length - 1])
    : "";
  errorMessageElement.textContent = errorMessage;
});

function getErrorMessage(element) {
  var errors = {
    "card-number": "Please enter a valid card number",
    "expiry-date": "Please enter a valid expiry date",
    cvv: "Please enter a valid cvv code",
  };
  return errors[element];
}

// this is just a utility function that will do HTTP calls
const http = ({ method, route, body }, callback) => {
  let requestData = {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };

  if (method.toLocaleLowerCase() === "get") {
    delete requestData.body;
  }

  fetch(`${window.location.origin}${route}`, requestData)
    .then((res) => res.json())
    .then((data) => callback(data))
    .catch((er) => console.log(er));
};
