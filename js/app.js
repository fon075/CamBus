const container=document.getElementById('seats');
if(container){
 for(let i=1;i<=32;i++){
  let s=document.createElement('div');
  s.className='seat';
  s.innerText=i;
  s.onclick=()=>s.classList.toggle('selected');
  container.appendChild(s);
 }
}