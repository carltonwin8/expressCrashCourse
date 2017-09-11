const users = document.getElementsByClassName('user');

for (user of users) {
  user.addEventListener("click", e => {
    e.preventDefault();
    if(confirm('are you sure')) {
      console.log(e);
      fetch('/users/delete/' + e.target.id, { method:  'DELETE'})
        .then(res => {
          window.location.replace('/db');
        })
        .catch(err => console.log('Error!\n' + err));
    }
  });
};
