import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export const chartBaseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: "#8F8F8F", font: { family: "Poppins", size: 11 } } } },
  scales: {
    x: { ticks: { color: "#5C5C5C", font: { size: 10 } }, grid: { color: "#1f1f1f" } },
    y: { ticks: { color: "#5C5C5C", font: { size: 10 } }, grid: { color: "#1f1f1f" } },
  },
};

export default ChartJS;
