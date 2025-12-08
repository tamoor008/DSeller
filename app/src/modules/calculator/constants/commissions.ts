import commissionsData from '../../../data/commissions.json';
import { CommissionNode, CommissionOption } from '../types';

type CommissionFile = { categories?: CommissionNode[] };

const { categories = [] } = commissionsData as CommissionFile;

const flattenCommissions = (
  nodes: CommissionNode[],
  parents: string[] = [],
): CommissionOption[] => {
  const options: CommissionOption[] = [];

  nodes.forEach((node) => {
    const currentPath = [...parents, node.name];

    if (typeof node.commission === 'number') {
      const id = currentPath.join(' > ');
      options.push({
        id,
        label: node.name,
        pathLabel: currentPath.join(' / '),
        commission: node.commission,
        group: parents[0] ?? node.name,
      });
    }

    if (node.children?.length) {
      options.push(...flattenCommissions(node.children, currentPath));
    }
  });

  return options;
};

const computedOptions = flattenCommissions(categories).sort((a, b) =>
  a.pathLabel.localeCompare(b.pathLabel),
);

const FALLBACK_OPTION: CommissionOption = {
  id: 'default',
  label: 'Default',
  pathLabel: 'Default',
  commission: 10,
  group: 'General',
};

export const COMMISSION_OPTIONS = computedOptions.length ? computedOptions : [FALLBACK_OPTION];

export const COMMISSION_GROUPS = COMMISSION_OPTIONS.reduce<Record<string, CommissionOption[]>>(
  (acc, option) => {
    if (!acc[option.group]) {
      acc[option.group] = [];
    }
    acc[option.group].push(option);
    return acc;
  },
  {},
);

const COMMISSION_MAP = new Map(COMMISSION_OPTIONS.map((option) => [option.id, option]));

export const DEFAULT_COMMISSION_OPTION = COMMISSION_OPTIONS[0];

export const getCommissionOption = (id: string | undefined) =>
  (id ? COMMISSION_MAP.get(id) : undefined) ?? DEFAULT_COMMISSION_OPTION;

