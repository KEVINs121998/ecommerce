import { getImageUrl } from '../services/api.js'

function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <article className="card mb-3">
      <div className="card-body d-flex flex-wrap align-items-center gap-3">
        <img className="cart-image rounded" src={getImageUrl(item.image)} alt="" />
        <div className="flex-grow-1">
          <h2 className="h6 mb-1">{item.name}</h2>
          <span className="text-body-secondary">${item.price.toFixed(2)} each</span>
        </div>
        <div className="btn-group" role="group" aria-label={`Quantity for ${item.name}`}>
          <button className="btn btn-outline-secondary" onClick={() => onDecrease(item.productId)} disabled={item.quantity <= 1} aria-label="Decrease quantity">−</button>
          <span className="btn btn-outline-secondary disabled" aria-live="polite">{item.quantity}</span>
          <button className="btn btn-outline-secondary" onClick={() => onIncrease(item.productId)} disabled={item.quantity >= item.stock} aria-label="Increase quantity">+</button>
        </div>
        <strong className="item-total">${(item.price * item.quantity).toFixed(2)}</strong>
        <button className="btn btn-link text-danger" onClick={() => onRemove(item.productId)}>Remove</button>
      </div>
    </article>
  )
}

export default CartItem
