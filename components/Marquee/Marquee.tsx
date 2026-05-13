import styles from './Marquee.module.css'

const ITEMS = [
  '7ENO',
  'Divine Authority',
  'MMXXVI',
  'Zeus-Inspired Streetwear',
  'Divine Authority',
  'No Gradients. No Shadows.',
  '7ENO',
  'Divine Authority',
  'MMXXVI',
  'Zeus-Inspired Streetwear',
  'Divine Authority',
  'No Gradients. No Shadows.',
]

export default function Marquee() {
  return (
    <div className={styles.strip} aria-hidden="true">
      <div className={styles.track}>
        {ITEMS.map((item, i) => (
          <span key={i} className={styles.item}>{item}</span>
        ))}
      </div>
    </div>
  )
}
