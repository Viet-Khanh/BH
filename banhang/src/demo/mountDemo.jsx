import DemoGate from './ui/DemoGate.jsx';
import './ui/demo.css';

// Entry point loaded by main.jsx only when __DEMO__ is true.
export const wrapWithDemo = (app) => <DemoGate app={app} />;
