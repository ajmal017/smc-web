import { Injectable, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { debounceTime, delay, switchMap, tap, map } from 'rxjs/operators';

import { SortColumn, SortDirection } from '../directives/sortable-header.directive';
import { Company } from '../interface/company';
// import { COMPANIES } from '../mock-data/company-mock';
import { HttpClient } from '@angular/common/http';
import { SMC_APIS } from '../common';

interface SearchResult {
  companyList: Company[];
  total: number;
}

interface State {
  page: number;
  pageSize: number;
  searchTerm: string;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}

const compare = (v1: string, v2: string) => v1 < v2 ? -1 : v1 > v2 ? 1 : 0;

function sort(companyList: Company[], column: SortColumn, direction: string): Company[] {
  if (direction === '' || column === '') {
    return companyList;
  } else {
    return [...companyList].sort((a, b) => {
      const res = compare(`${a[column]}`, `${b[column]}`);
      return direction === 'asc' ? res : -res;
    });
  }
}

function matches(company: Company, term: string, pipe: PipeTransform) {
  return company.name.toLowerCase().includes(term.toLowerCase());
}


@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _companyList$ = new BehaviorSubject<Company[]>([]);
  private _total$ = new BehaviorSubject<number>(0);

  private _state: State = {
    page: 1,
    pageSize: 15,
    searchTerm: '',
    sortColumn: '',
    sortDirection: ''
  };

  constructor(
    private _httpClient: HttpClient,
    private pipe: DecimalPipe) { 
    this._search$.pipe(
      tap(() => this._loading$.next(true)),
      debounceTime(200),
      switchMap(() => this._search()),
      delay(200),
      tap(() => this._loading$.next(false))
    ).subscribe(result => {
      this._companyList$.next(result.companyList);
      this._total$.next(result.total);
    });

    this._search$.next();
  }

  get companyList$() { return this._companyList$.asObservable(); }
  get total$() { return this._total$.asObservable(); }
  get loading$() { return this._loading$.asObservable(); }
  get page() { return this._state.page; }
  get pageSize() { return this._state.pageSize; }
  get searchTerm() { return this._state.searchTerm; }

  set page(page: number) { this._set({page}); }
  set pageSize(pageSize: number) { this._set({pageSize}); }
  set searchTerm(searchTerm: string) { this._set({searchTerm}); }
  set sortColumn(sortColumn: SortColumn) { this._set({sortColumn}); }
  set sortDirection(sortDirection: SortDirection) { this._set({sortDirection}); }

  private _set(patch: Partial<State>) {
    Object.assign(this._state, patch);
    this._search$.next();
  }

  private _search(): Observable<SearchResult> {
    const {sortColumn, sortDirection, pageSize, page, searchTerm} = this._state;

    return this._httpClient.get<any>(SMC_APIS.company).pipe(
      map(data=>{
        // 1. sort
        let companyList = sort(data, sortColumn, sortDirection);

        // 2. filter
        companyList = companyList.filter(company => matches(company, searchTerm, this.pipe));
        const total = companyList.length;

        // 3. paginate
        companyList = companyList.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
        return {companyList, total};
      })
    );
  }

  public fetch(): void{
    this.searchTerm = "";
  }

  public addNew(company: any): Observable<any>{
    return this._httpClient.post(SMC_APIS.company, JSON.stringify(company));
  }

  public update(company: any): Observable<any>{
    return this._httpClient.put(SMC_APIS.company, JSON.stringify(company));
  }

  public delete(id: string): Observable<any>{
    return this._httpClient.delete(SMC_APIS.company+"/"+id);
  }
}
