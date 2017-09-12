const users = document.getElementsByClassName('user');

for (user of users) {
  user.addEventListener("click", e => {
    e.preventDefault();
    const dataDel = e.target.getAttribute('data-del');
    const redirect =
      (dataDel === '/users/delete')
        ? '/'
        : (dataDel === '/users/deletedb')
          ? '/db'
          : '/db2';
    console.log(dataDel);
    if(confirm('are you sure')) {
      fetch(dataDel + "/" + e.target.id, { method:  'DELETE'})
        .then(res => { window.location.replace(redirect); })
        .catch(err => console.log('Error!\n' + err));
    }
  });
};
