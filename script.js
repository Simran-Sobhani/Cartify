fetch('https://fakestoreapiserver.reactbd.org/api/categories')
  .then(response => response.json())
  .then(data => {
    const categories = document.getElementById('categories');
    data.data.forEach(category => {
      const check = document.createElement('input')
      check.type = 'checkbox';
      check.name = 'category';
      check.value = category.name;
      const label = document.createElement('label');
      label.appendChild(check);
      label.for = category.name;
      const p = document.createElement('div');
      p.innerText = category.name;
      label.appendChild(p)
      categories.appendChild(label);

      check.addEventListener('change', () => console.log(category.name))
    })
  })

const cartItems = []

fetch('https://fakestoreapiserver.reactbd.org/api/products')
  .then(response => response.json())
  .then(data => {
    const cart = document.getElementById('cart');
    const container = document.getElementById('container');
    data.data.forEach(product => {
      console.log(product)
      const card = document.createElement('div');
      card.className = "card"
      const img = document.createElement('img');
      img.src = product.image;
      const title = document.createElement('h4');
      title.innerText = product.title;
      const price = document.createElement('p');
      price.innerText = product.price;
      const btn = document.createElement('button');
      btn.innerText = "Add to Cart";
      btn.addEventListener('click', ()=>{
        console.log('clicked')
        let qty = 0;
        let idx = 0;
        for (let i = 0; i < cartItems.length; i++){
          if (cartItems[i].name == product.title){
            cartItems[i].qty += 1
            qty = cartItems[i].qty;
            idx = i;
            break
          }
        }
        if (!qty) {
          const prod = document.createElement('div');
          prod.className = 'card';
          const img = document.createElement('img');
          img.src = product.image;
          const title = document.createElement('h4');
          title.innerText = product.title;
          const price = document.createElement('p');
          price.innerText = product.price;
          qty = 1
          cartItems.push({
            name: product.title,
            qty: 1
          });
          const quantity = document.createElement('p');
          const del = document.createElement('button');
          del.innerText = 'Delete'
          del.addEventListener('click' , () => {
              cart.removeChild(prod)
            })
            prod.appendChild(img);
            prod.appendChild(title);
            prod.appendChild(price);
            quantity.innerText = qty
            prod.appendChild(quantity);
            prod.appendChild(del);
            cart.appendChild(prod);
        } else {
          console.log(cart)
          const p = cart.getElementsByTagName('div')[idx].getElementsByTagName('p')
          p[1].innerText = qty;
          console.log(p)
        }
      });
      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(price);
      card.appendChild(btn);
      container.appendChild(card);
      
  });
  });


