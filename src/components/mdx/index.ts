import Eli10 from './Eli10.astro';
import Callout from './Callout.astro';
import Story from './Story.astro';
import Scenario from './Scenario.astro';
import UseWhen from './UseWhen.astro';
import DeepDive from './DeepDive.astro';
import Figure from './Figure.astro';
import Compare from './Compare.astro';
import Flow from './Flow.astro';
import ResponsibilityGrid from './ResponsibilityGrid.astro';
import DemandChart from './DemandChart.astro';
import SlaCalculator from './SlaCalculator.astro';
import CostChart from './CostChart.astro';
import TableWrap from './TableWrap.astro';
import TryIt from './TryIt.astro';
import Datacenter3D from './Datacenter3D.astro';
import PortalTour from './PortalTour.astro';
import InteractiveLearningActivity from '../InteractiveLearningActivity.astro';

/** Components available in every tutorial MDX file without an import. */
export const mdxComponents = {
  Eli10,
  Callout,
  Story,
  Scenario,
  UseWhen,
  DeepDive,
  Figure,
  Compare,
  Flow,
  ResponsibilityGrid,
  DemandChart,
  SlaCalculator,
  CostChart,
  TryIt,
  Datacenter3D,
  PortalTour,
  /** <Activity id="…" /> places one of the lesson's interactive activities (src/data/<exam>/activities.ts). */
  Activity: InteractiveLearningActivity,
  InteractiveLearningActivity,
  table: TableWrap,
};
