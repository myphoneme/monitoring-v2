import styles from './MonthSelector.module.css'

function MonthSelector({ months, selectedMonth, onMonthSelect, formatMonth }) {
  return (
    <div className={styles.monthSelector}>
      <label className={styles.label}>Select Month:</label>
      <select 
        className={styles.select}
        value={selectedMonth}
        onChange={(e) => onMonthSelect(e.target.value)}
      >
        <option value="">Choose a month...</option>
        {months.map(month => (
          <option key={month} value={month}>
            {formatMonth(month)}
          </option>
        ))}
      </select>
    </div>
  )
}

export default MonthSelector