import {
  Container, LinearProgress,
  Link, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Tooltip, Dialog, DialogContent, DialogTitle
} from '@mui/material';
import EmbedIcon from '@mui/icons-material/Attachment';
import SurveyIcon from '@mui/icons-material/Poll';
import { Link as RouterLink, } from 'react-router-dom';
import React, { useContext, useMemo, useState } from 'react';
import { APIContext } from '../App';
import ConfessionActionButtons from '../components/ConfessionActionButtons';
import usePagination from '../components/pagination';
import ShortEmbed from '../components/ShortEmbed';
import StyledTableRow from '../components/StyledTableRow';
import { HttpClient } from '../service/HttpClient';
import { noOpFn, toggleStatus } from '../utils';

export type IConfession = any

const getPage = (httpClient: HttpClient) =>
  (page: number, perPage: number) =>
    httpClient.SWALLOW(httpClient.GET(`/confessions?page=${page}&perPage=${perPage}`));

let confessionText
const ViewConfessionDialog = ({text, more, onClose}) => {
  return (
    <Dialog open={more} onClose={onClose}>
      <DialogTitle>
        Confession message:
      </DialogTitle>
      <DialogContent>
        {text}
      </DialogContent>
    </Dialog>
  )
}

export default function Confessions() {
  const { httpClient, apiClient } = useContext(APIContext);
  const [ showMore, setShowMore ] = useState(false);

  const getPageMemoized = useMemo(() => getPage(httpClient), [httpClient]);

  const {
    data: confessions, isLoading, paginationComponent, setData,
  } = usePagination(getPageMemoized);

  const addEntry = (confession: IConfession, options?) => apiClient.confessions.add(confession, options)
    .then((response) => {
      setData({ type: 'replace', id: confession._id, patchObject: response.patchObject });
    }).catch(noOpFn);

  const setStatusFn = (confession: IConfession, note?: string) =>
    apiClient.confessions.setStatus(confession, { status: toggleStatus(confession.status), note })
      .then((response) => {
        setData({ type: 'replace', id: confession._id, patchObject: response.patchObject });
      }).catch(noOpFn);

  const deleteEntryFn = (confession: IConfession) => apiClient.confessions.delete(confession)
    .then((response) => {
      setData({ type: 'replace', id: confession._id, patchObject: response.patchObject });
    }).catch(noOpFn);

  return (
    <Container>
      <ViewConfessionDialog
        text={confessionText}
        more={showMore}
        onClose={() => setShowMore(!showMore)}
      />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Text</TableCell>
              <TableCell>Embed</TableCell>
              <TableCell>Auth</TableCell>
              <TableCell>Entry</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {confessions.map((confession: IConfession) => (
              <StyledTableRow key={confession._id} status={confession.status} hover>
                <TableCell>
                  <RouterLink to={`/confessions/${confession._id}`}>
                    {confession._id}
                  </RouterLink>
                  <div>
                    {confession.survey && <Tooltip title="confession with survey"><SurveyIcon /></Tooltip>}
                    {confession.embed && <Tooltip title="confession with embedded content"><EmbedIcon /></Tooltip>}
                  </div>
                </TableCell>
                <TableCell style={{ whiteSpace: 'pre-line' }} onClick={() => {confessionText = confession.text ; setShowMore(!showMore)}}>
                  {`${confession.text.substring(0, 30).trim()}...`}
                </TableCell>
                <TableCell style={{ maxWidth: 100, textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  <ShortEmbed url={confession.embed} />
                </TableCell>
                <TableCell>
                  {confession.auth}
                </TableCell>
                <TableCell style={{ maxWidth: 250, textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {confession.slug && (
                    <Link href={`https://hejto.pl/wpis/${confession.slug}`} rel="noopener" target="_blank">
                      {confession.slug}
                    </Link>
                  )}
                </TableCell>
                <TableCell>
                  <ConfessionActionButtons
                    model={confession}
                    acceptFn={addEntry}
                    setStatusFn={setStatusFn}
                    deleteFn={deleteEntryFn}
                  />
                </TableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
        {isLoading && <LinearProgress />}
        {paginationComponent}
    </Container>
  );
}
