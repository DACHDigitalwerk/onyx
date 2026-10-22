/**
 * The mounted checks card starts a run only from Start Checks or Re-run
 * Checks: a form change after a run flags the change and waits. Check rows
 * read the result line the backend gives, with the guide's state words as the
 * fallback, and keep every guidance text in their tooltip. The card names why a
 * run failed and can stop one.
 */
import { Formik, useFormikContext, type FormikContextType } from "formik";
import {
  act,
  render,
  screen,
  setupUser,
  waitFor,
} from "@tests/setup/test-utils";
import CredentialChecksCard, {
  type CheckLine,
  CheckCardView,
  CheckLineGroups,
} from "@/views/admin/connectors/AddConnectorPage/components/CredentialChecksCard";
import {
  fetchDraftCheckPlan,
  startDraftCheckRun,
} from "@/lib/connectors/checks/svc";
import { NO_CHECKS } from "@/lib/connectors/checks/hooks";
import type {
  ConnectorChecksStatus,
  DraftCheckRunSnapshot,
  DraftCheckState,
} from "@/lib/connectors/checks/types";
import { ValidSources } from "@/lib/connectors/types/source";

jest.mock("@/lib/connectors/checks/svc", () => ({
  startDraftCheckRun: jest.fn(),
  startPairEditCheckRun: jest.fn(),
  fetchDraftCheckPlan: jest.fn(),
  cancelDraftCheckRun: jest.fn(async () => undefined),
}));
// A run fetch returns what the latest start request returned.
jest.mock("@/lib/fetcher", () => ({
  errorHandlingFetcher: jest.fn(async () => {
    const { startDraftCheckRun } = jest.requireMock(
      "@/lib/connectors/checks/svc"
    );
    return startDraftCheckRun.mock.results.at(-1)?.value;
  }),
}));
// No credential-bound fields, and every form value is part of what a run checks.
jest.mock("@/lib/connectors/connectors", () => ({
  useConnectorConfiguration: () => ({ values: [], advanced_values: [] }),
}));
jest.mock("@/lib/connectors/utils", () => ({
  splitCredentialBoundFields: () => ({ values: [], advancedValues: [] }),
}));
jest.mock("@/lib/connectors/checks/formState", () => ({
  connectorFormState: (
    _source: unknown,
    _configuration: unknown,
    values: unknown
  ) => values,
}));
jest.mock("@/lib/settings/hooks", () => ({
  useSettings: () => ({ appName: "Onyx" }),
}));

const startMock = startDraftCheckRun as jest.MockedFunction<
  typeof startDraftCheckRun
>;
const planMock = fetchDraftCheckPlan as jest.MockedFunction<
  typeof fetchDraftCheckPlan
>;

const SIGN_IN: DraftCheckState = {
  check_id: "sign_in",
  display_name: "Sign in",
  capability: "indexing",
  required: true,
  state: "pending",
  message: "",
  summary: null,
  description: null,
  error_kind: null,
  not_run_reason: null,
  missing_fields: [],
  invalid_fields: [],
  remediation: null,
  docs_link: null,
  duration_ms: null,
  from_cache: false,
  validates_binding: true,
  findings: [],
};

const PASSED_RUN: DraftCheckRunSnapshot = {
  run_id: "run-1",
  draft_key: "draft",
  source: ValidSources.Confluence,
  credential_id: 1,
  access_type: "public",
  status: "completed",
  form_errors: {},
  unknown_fields: [],
  checks: [{ ...SIGN_IN, state: "passed", duration_ms: 1 }],
};

let form: FormikContextType<Record<string, unknown>> | null = null;

function FormProbe() {
  form = useFormikContext<Record<string, unknown>>();
  return null;
}

function renderCard() {
  return render(
    <Formik initialValues={{}} onSubmit={() => {}}>
      <>
        <FormProbe />
        <CredentialChecksCard
          source={ValidSources.Confluence}
          credential={{ credential_id: 1 }}
          locked={false}
        />
      </>
    </Formik>
  );
}

beforeEach(() => {
  form = null;
  startMock.mockReset();
  planMock.mockReset();
  planMock.mockResolvedValue({
    source: ValidSources.Confluence,
    access_type: "public",
    form_errors: {},
    unknown_fields: [],
    checks: [SIGN_IN],
  });
  startMock.mockResolvedValue(PASSED_RUN);
});

it("starts no run when a field changes after a run, until Re-run Checks", async () => {
  const user = setupUser();
  renderCard();

  await user.click(await screen.findByRole("button", { name: "Start Checks" }));
  await waitFor(() => expect(startMock).toHaveBeenCalledTimes(1));
  await screen.findByText("1 successful");

  await act(() => form!.setFieldValue("include_comments", true));

  expect(await screen.findByText("Settings changed")).toBeInTheDocument();
  expect(startMock).toHaveBeenCalledTimes(1);

  await user.click(screen.getByRole("button", { name: "Re-run Checks" }));
  await waitFor(() => expect(startMock).toHaveBeenCalledTimes(2));
  // A re-run after a change reuses the cached results of unchanged checks.
  expect(startMock.mock.calls[1]?.[0]).toMatchObject({
    form_state: { include_comments: true },
    rerun: "none",
  });
  await waitFor(() =>
    expect(screen.queryByText("Settings changed")).not.toBeInTheDocument()
  );
});

function line(
  overrides: Partial<CheckLine> & Pick<CheckLine, "state">
): CheckLine {
  return {
    capability: "indexing",
    check_id: "sign_in",
    display_name: "Sign in to Confluence",
    required: true,
    message: "",
    summary: null,
    description: null,
    remediation: null,
    docs_link: null,
    ...overrides,
  };
}

test("shows the result line in place of the state word or the raw message", () => {
  render(
    <CheckLineGroups
      lines={[
        line({ state: "passed", summary: "34 spaces visible" }),
        line({
          check_id: "auth",
          state: "failed",
          message: "Confluence rejected the credential (invalid_auth).",
          summary: "Sign-in rejected",
        }),
      ]}
    />
  );

  expect(screen.getByText("34 spaces visible")).toBeInTheDocument();
  expect(screen.getByText("Sign-in rejected")).toBeInTheDocument();
  expect(screen.queryByText("Successful")).not.toBeInTheDocument();
  expect(screen.queryByText(/invalid_auth/)).not.toBeInTheDocument();
});

test("reads incomplete and legacy indeterminate checks as Incomplete", () => {
  render(
    <CheckLineGroups
      lines={[
        line({ state: "incomplete" }),
        line({ check_id: "legacy", state: "indeterminate" }),
      ]}
    />
  );

  expect(screen.getByText("2 Incomplete")).toBeInTheDocument();
  expect(screen.getAllByText("Incomplete")).toHaveLength(2);
});

test("a failed row's tooltip gives both the description and the repair step", async () => {
  const user = setupUser();
  render(
    <CheckLineGroups
      lines={[
        line({
          state: "failed",
          summary: "Invalid channel pattern: [a",
          description: "Indexing cannot filter channels with this pattern.",
          remediation: "Fix the channel regex in the connector settings.",
        }),
      ]}
    />
  );

  await user.hover(screen.getByRole("button", { name: "More information" }));

  const tooltip = await screen.findByRole("tooltip");
  expect(tooltip).toHaveTextContent(
    "Indexing cannot filter channels with this pattern."
  );
  expect(tooltip).toHaveTextContent(
    "Fix the channel regex in the connector settings."
  );
});

test("a successful row's tooltip gives its description", async () => {
  const user = setupUser();
  render(
    <CheckLineGroups
      lines={[
        line({
          state: "passed",
          summary: "Signed in",
          description: "The app can read only the sites it was granted.",
        }),
      ]}
    />
  );

  await user.hover(screen.getByRole("button", { name: "More information" }));

  expect(await screen.findByRole("tooltip")).toHaveTextContent(
    "The app can read only the sites it was granted."
  );
});

function renderCardView(
  status: ConnectorChecksStatus,
  props: { failureReason?: string; onCancel?: () => void } = {}
) {
  render(
    <CheckCardView
      status={status}
      results={[]}
      openChecks={[]}
      inProgressCount={0}
      expectedCount={0}
      stateCounts={NO_CHECKS}
      onRerun={jest.fn()}
      {...props}
    />
  );
}

test("names the server's reason when the run failed to run", () => {
  const reason = "Credential 26 is shared with you.";
  renderCardView("failedToRun", { failureReason: reason });

  expect(screen.getAllByText(reason).length).toBeGreaterThan(0);
  expect(
    screen.queryByText("Checks failed to run. Try again.")
  ).not.toBeInTheDocument();
});

test("offers Cancel only while the checks run", async () => {
  const user = setupUser();
  const onCancel = jest.fn();
  renderCardView("running", { onCancel });

  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onCancel).toHaveBeenCalledTimes(1);
});

test("offers no Cancel once the checks finished", () => {
  renderCardView("passed", { onCancel: jest.fn() });

  expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
});
