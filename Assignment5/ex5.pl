maximum_printing_depth(100).

:- current_prolog_flag(toplevel_print_options, A),
   (select(max_depth(_), A, B), ! ; A = B),
   maximum_printing_depth(MPD),
   set_prolog_flag(toplevel_print_options, [max_depth(MPD)|B]).

% Signature: unique(List, UniqueList, Dups)/3
% Purpose: succeeds if and only if UniqueList contains the same elements of List without duplicates (according to their order in List), and Dups contains the duplicates

notthere(_, []).
notthere(X, [Y| F]) :- X \= Y, notthere(X, F).


there(X, [X| _]).
there(X, [_| T]) :- there(X, T).

unique(List, UniqueList, Dups) :- unique(List, UniqueList, Dups, UniqueList).
unique([], [], [], _).
unique([X| T], [X| F], [X| G], FullUniqueList) :- unique(T, F, [X| G], FullUniqueList), notthere(X, F), there(X, T).
unique([X| T], [X| F], [Z| G], FullUniqueList) :- unique(T, F, [Z| G], FullUniqueList), X \= Z, notthere(X, F), there(Z, T), there(Z, FullUniqueList).
unique([X| T], [Y| F], [X| G], FullUniqueList) :- unique(T, [Y| F], G, FullUniqueList), X \= Y, notthere(Y, F), notthere(X, F), there(X, FullUniqueList).
unique([X| T], [X| F], [], FullUniqueList) :- unique(T, F, [], FullUniqueList), notthere(X, F).
unique([X| T], [], [X| G], FullUniqueList) :- unique(T, [], G, FullUniqueList), there(X, FullUniqueList).