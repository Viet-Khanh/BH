import { useEditionFeature } from '../../editions/useEdition.js';
import { getMeasuredQty } from '../../utils/lineMeasure.js';
import { formatDimension, formatMeasure } from '../../utils/measureFormat.js';

// Read-only table cells for editions that sell by length × width.
// Each renders nothing when the edition has no dimensions.

export const useMeasureColumnCount = ({ measuredQty = false } = {}) =>
  useEditionFeature('dimensions') ? 2 + (measuredQty ? 1 : 0) : 0;

export const DimensionHeaders = () =>
  useEditionFeature('dimensions') ? (
    <>
      <th>Dài</th>
      <th>Rộng</th>
    </>
  ) : null;

export const DimensionCells = ({ item }) =>
  useEditionFeature('dimensions') ? (
    <>
      <td>{formatDimension(item.length)}</td>
      <td>{formatDimension(item.width)}</td>
    </>
  ) : null;

export const MeasuredQtyHeader = ({ label = 'SL/m2' }) =>
  useEditionFeature('dimensions') ? <th>{label}</th> : null;

export const MeasuredQtyCell = ({ item }) =>
  useEditionFeature('dimensions') ? (
    <td>{formatMeasure(getMeasuredQty(item))}</td>
  ) : null;
