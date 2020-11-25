
var url = "https://passwordresetflow.herokuapp.com"
function getUser()
{
    
    let emailId = document.getElementById("Email").value;
    
    
    fetch(url + "/users/resetPassword/" + emailId)
    .then((res) =>{
         return res.json()
    })
    .then(
      (res)=> {
          if(!res.result)
              alert("Invalid Email Id, please Type a valid one !")
          else
              {
                  alert("Please Check your Email to reset password !")
                  window.location.href="index.html"
              }
          
      }
    )
    
}

function RegisterMail()
{
    let mail = document.getElementById("Email").value;
    let emailIdPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    let registrationURL = url + "/users"
    if(!mail.match(emailIdPattern))
    {
        alert("Please enter a valid email Id to register!")
    }
    let payload = {
        EmailId: mail
    }
    
    fetch(registrationURL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
            "Content-type": "application/json"
        }
    })
    .then((res)=>res.json())
    .then(res => {
        if(!res.result)
        {
            alert("Registration Failed !")
            return 
        }
        alert("Registration Successfull");
    })
}


